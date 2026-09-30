package com.demo.application.exception;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Maps every error to an RFC 7807 ProblemDetail. Framework errors (bad JSON,
 * type mismatch, unknown route, ...) are handled by the superclass; this
 * class adds validation field errors, domain exceptions and DB constraints.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    static final String SQLSTATE_UNIQUE_VIOLATION = "23505";
    static final String SQLSTATE_CHECK_VIOLATION = "23514";
    static final String SQLSTATE_FOREIGN_KEY_VIOLATION = "23503";

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request has invalid fields");
        body.setTitle("Validation failed");
        body.setProperty("errors", errors);
        return handleExceptionInternal(ex, body, headers, HttpStatus.BAD_REQUEST, request);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, @Nullable Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {
        if (body instanceof ProblemDetail pd && pd.getInstance() == null
                && request instanceof ServletWebRequest swr) {
            pd.setInstance(java.net.URI.create(swr.getRequest().getRequestURI()));
        }
        return super.handleExceptionInternal(ex, body, headers, statusCode, request);
    }

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail handleNotFound(NotFoundException ex, HttpServletRequest request) {
        return problem(HttpStatus.NOT_FOUND, "Not found", ex.getMessage(), request);
    }

    @ExceptionHandler(BadRequestException.class)
    ProblemDetail handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        return problem(HttpStatus.BAD_REQUEST, "Bad request", ex.getMessage(), request);
    }

    @ExceptionHandler(BomCycleException.class)
    ProblemDetail handleCycle(BomCycleException ex, HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "BOM cycle", ex.getMessage(), request);
    }

    @ExceptionHandler(ConflictException.class)
    ProblemDetail handleConflict(ConflictException ex, HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "Conflict", ex.getMessage(), request);
    }

    /** Fallback when a DB constraint fires despite the service pre-checks (e.g. races). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        SQLException sql = findSqlException(ex);
        String state = sql == null ? null : sql.getSQLState();
        String message = sql == null ? "Data integrity violation" : sql.getMessage();

        if (SQLSTATE_CHECK_VIOLATION.equals(state) && message != null && message.contains("BOM cycle")) {
            return problem(HttpStatus.CONFLICT, "BOM cycle", firstLine(message), request);
        }
        if (SQLSTATE_UNIQUE_VIOLATION.equals(state)) {
            return problem(HttpStatus.CONFLICT, "Conflict", "A record with the same unique value already exists", request);
        }
        if (SQLSTATE_FOREIGN_KEY_VIOLATION.equals(state)) {
            return problem(HttpStatus.CONFLICT, "Conflict", "Referenced record does not exist", request);
        }
        log.warn("Data integrity violation (SQLSTATE {}): {}", state, message);
        return problem(HttpStatus.BAD_REQUEST, "Bad request", "Request violates a data constraint", request);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", "Unexpected error", request);
    }

    private static ProblemDetail problem(HttpStatus status, String title, String detail, HttpServletRequest request) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        pd.setInstance(java.net.URI.create(request.getRequestURI()));
        return pd;
    }

    private static SQLException findSqlException(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t instanceof SQLException sql) {
                return sql;
            }
        }
        return null;
    }

    private static String firstLine(String message) {
        int nl = message.indexOf('\n');
        String line = nl < 0 ? message : message.substring(0, nl);
        return line.startsWith("ERROR: ") ? line.substring("ERROR: ".length()) : line;
    }
}

package com.demo.application.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
        title = "Item / Part / Site / BOM API",
        version = "v1",
        description = "Master data CRUD and Item BOM graph traversal"))
public class OpenApiConfig {
}

package com.demo.application.mapper;

import com.demo.application.dto.PartRequest;
import com.demo.application.dto.PartResponse;
import com.demo.application.model.Part;

public final class PartMapper {

    private PartMapper() {
    }

    public static PartResponse toResponse(Part part) {
        return new PartResponse(
                part.getId(),
                part.getPartNumber(),
                part.getPartName(),
                part.getDescription(),
                part.getManufactureName(),
                part.getLifeCyclePhase(),
                part.getCreatedAt(),
                part.getUpdatedAt());
    }

    /** Copies every request field onto the entity (create and full update). */
    public static void apply(PartRequest request, Part part) {
        part.setPartNumber(request.partNumber().trim());
        part.setPartName(request.partName().trim());
        part.setDescription(request.description());
        part.setManufactureName(request.manufactureName());
        part.setLifeCyclePhase(request.lifeCyclePhase());
    }
}

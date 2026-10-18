package com.veryfact.check.dto;

public record FactCheckMatchDto(
        String claimText, String claimant, String publisher, String title, String url, String textualRating) {}

package com.veryfact.search;

public class SearchUnavailableException extends RuntimeException {
    public SearchUnavailableException(String message) {
        super(message);
    }
}

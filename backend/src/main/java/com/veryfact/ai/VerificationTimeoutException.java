package com.veryfact.ai;

public class VerificationTimeoutException extends RuntimeException {
    public VerificationTimeoutException() {
        super("Live Google Search verification timed out. Please try again later.");
    }
}

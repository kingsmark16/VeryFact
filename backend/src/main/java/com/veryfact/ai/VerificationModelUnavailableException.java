package com.veryfact.ai;

public class VerificationModelUnavailableException extends RuntimeException {
    public VerificationModelUnavailableException() {
        super("The selected verification model is unavailable for this Google project.");
    }
}

package com.veryfact.extractor;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import org.springframework.stereotype.Component;

@Component
public class SsrfGuard {

    public URI validatePublicHttpUri(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalArgumentException("URL must not be blank.");
        }

        URI uri;
        try {
            uri = URI.create(rawUrl.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid URL syntax.");
        }

        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("Only http and https URLs are allowed.");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL must include a valid host.");
        }

        InetAddress[] addresses = resolveAddresses(host);
        if (addresses.length == 0) {
            throw new IllegalArgumentException("Unable to resolve URL host.");
        }

        for (InetAddress addr : addresses) {
            if (isForbiddenAddress(addr)) {
                throw new IllegalArgumentException("URLs pointing to private or local networks are not allowed.");
            }
        }

        return uri;
    }

    InetAddress[] resolveAddresses(String host) {
        try {
            return InetAddress.getAllByName(host);
        } catch (UnknownHostException ex) {
            throw new IllegalArgumentException("Unable to resolve URL host.");
        }
    }

    boolean isForbiddenAddress(InetAddress addr) {
        return addr.isLoopbackAddress()
                || addr.isAnyLocalAddress()
                || addr.isLinkLocalAddress()
                || addr.isSiteLocalAddress()
                || addr.isMulticastAddress();
    }
}

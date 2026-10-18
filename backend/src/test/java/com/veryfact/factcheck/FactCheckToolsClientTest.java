package com.veryfact.factcheck;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FactCheckToolsClientTest {

    @Test
    void searchClaims_whenApiKeyIsBlank_returnsEmptyListWithoutNetworkCall() {
        FactCheckToolsClient client = new FactCheckToolsClient(new FactCheckProperties(""));

        assertThat(client.searchClaims("The Earth is flat according to viral post."))
                .isEmpty();
    }

    @Test
    void searchClaims_whenTextIsBlank_returnsEmptyList() {
        FactCheckToolsClient client = new FactCheckToolsClient(new FactCheckProperties("dummy-key"));

        assertThat(client.searchClaims("   ")).isEmpty();
    }
}

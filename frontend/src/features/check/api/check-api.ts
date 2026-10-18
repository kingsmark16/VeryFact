import { useMutation, useQuery } from "@tanstack/react-query";
import { axiosClient } from "@/api/axios-client";
import type { components } from "@/api/schema";

export type CreateCheckRequest = components["schemas"]["CreateCheckRequest"];
export type CreateCheckResponse = components["schemas"]["CreateCheckResponse"];
export type CheckResult = components["schemas"]["CheckResultDto"];
export type Claim = components["schemas"]["ClaimDto"];
export type Verdict = NonNullable<CheckResult["overallVerdict"]>;

const TERMINAL_STATUSES = ["COMPLETED", "FAILED"];

export function useCreateCheck() {
  return useMutation({
    mutationFn: async (request: CreateCheckRequest) => {
      const { data } = await axiosClient.post<CreateCheckResponse>("/api/checks", request);
      return data;
    },
  });
}

export function useCheckResult(slug: string) {
  return useQuery({
    queryKey: ["check", slug],
    queryFn: async () => {
      const { data } = await axiosClient.get<CheckResult>(`/api/checks/${slug}`);
      return data;
    },
    refetchInterval: (query) =>
      query.state.data?.status && TERMINAL_STATUSES.includes(query.state.data.status)
        ? false
        : 1500,
  });
}

import { useMutation, useQuery } from "@tanstack/react-query";
import { axiosClient } from "@/api/axios-client";
import type { components } from "@/api/schema";

export type CreateCheckRequest = components["schemas"]["CreateCheckRequest"];
export type CreateCheckResponse = components["schemas"]["CreateCheckResponse"];
export type CheckResult = components["schemas"]["CheckResultDto"];
export type RecentCheck = components["schemas"]["RecentCheckDto"];
export type Claim = components["schemas"]["ClaimDto"];
export type Verdict = NonNullable<CheckResult["overallVerdict"]>;

export interface CheckSubmissionInput {
  text?: string;
  url?: string;
  images?: File[];
}

const TERMINAL_STATUSES = ["COMPLETED", "FAILED"];

export function useCreateCheck() {
  return useMutation({
    mutationFn: async (input: CheckSubmissionInput) => {
      const hasUrl = Boolean(input.url && input.url.trim().length > 0);
      const hasImages = Boolean(input.images && input.images.length > 0);

      if (!hasUrl && !hasImages) {
        const { data } = await axiosClient.post<CreateCheckResponse>("/api/checks", {
          text: input.text ?? "",
        });
        return data;
      }

      const formData = new FormData();
      if (input.text && input.text.trim().length > 0) {
        formData.append("text", input.text.trim());
      }
      if (input.url && input.url.trim().length > 0) {
        formData.append("url", input.url.trim());
      }
      for (const file of input.images ?? []) {
        formData.append("images", file);
      }

      const { data } = await axiosClient.post<CreateCheckResponse>("/api/checks", formData);
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

export function useRecentChecks() {
  return useQuery({
    queryKey: ["checks", "recent"],
    queryFn: async () => {
      const { data } = await axiosClient.get<RecentCheck[]>("/api/checks/recent");
      return data;
    },
    staleTime: 30_000,
  });
}

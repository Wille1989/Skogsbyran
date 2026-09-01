import { useMutation } from "@tanstack/react-query";
import { create } from "./api";
import type { CreatePropertyInput } from "./types";

export function useCreatePropertyMutation() {
    return useMutation({
        mutationFn: (input: CreatePropertyInput) => 
            create(input),
    });
}
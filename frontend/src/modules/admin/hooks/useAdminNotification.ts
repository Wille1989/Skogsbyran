import { useOutletContext } from "react-router-dom";

export function useAdminNotification() {
    return useOutletContext<{ notify: (message: string) => void }>().notify;
}

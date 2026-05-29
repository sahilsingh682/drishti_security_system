import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const BackButton = ({ label = "Back" }: { label?: string }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      data-clickable
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </button>
  );
};

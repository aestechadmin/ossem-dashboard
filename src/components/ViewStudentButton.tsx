import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

type Section = "fees" | "hostel" | "attendance";

type ViewStudentButtonProps = {
  studentId: number | string | null | undefined;
  section?: Section;
};

export default function ViewStudentButton({ studentId, section }: ViewStudentButtonProps) {
  const navigate = useNavigate();
  const id = Number(studentId);
  if (!Number.isFinite(id) || id <= 0) return null;

  return (
    <Button
      size="small"
      variant="outlined"
      onClick={(e) => {
        e.stopPropagation();
        navigate(section ? `/students/${id}?section=${section}` : `/students/${id}`);
      }}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        minWidth: 64,
        borderColor: "divider",
        color: "primary.main",
        "&:hover": {
          bgcolor: "primary.main",
          color: "#fff",
          borderColor: "primary.main",
        },
      }}
    >
      View
    </Button>
  );
}

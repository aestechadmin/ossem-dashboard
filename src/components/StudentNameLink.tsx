import { ButtonBase } from "@mui/material";
import { useNavigate } from "react-router-dom";

type Section = "fees" | "hostel" | "attendance";

type StudentNameLinkProps = {
  studentId: number | string | null | undefined;
  name: string;
  section?: Section;
};

export default function StudentNameLink({ studentId, name, section }: StudentNameLinkProps) {
  const navigate = useNavigate();
  const id = Number(studentId);
  if (!Number.isFinite(id) || id <= 0) return name || "—";

  return (
    <ButtonBase
      onClick={(event) => {
        event.stopPropagation();
        navigate(section ? `/students/${id}?section=${section}` : `/students/${id}`);
      }}
      sx={{
        color: "primary.main",
        fontWeight: 600,
        textAlign: "left",
        justifyContent: "flex-start",
        borderRadius: 0.5,
        "&:hover": { textDecoration: "underline" },
      }}
    >
      {name || "—"}
    </ButtonBase>
  );
}

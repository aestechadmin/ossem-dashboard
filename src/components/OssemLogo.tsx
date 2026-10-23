import { Box, SxProps, Theme } from "@mui/material";
import loginLogo from "@/assets/login-logo.png";

type OssemLogoProps = {
  maxWidth?: number | string;
  sx?: SxProps<Theme>;
};

export default function OssemLogo({ maxWidth = 240, sx }: OssemLogoProps) {
  return (
    <Box
      component="img"
      src={loginLogo}
      alt="OSSEM"
      sx={{
        width: "100%",
        maxWidth,
        height: "auto",
        display: "block",
        objectFit: "contain",
        ...sx,
      }}
    />
  );
}

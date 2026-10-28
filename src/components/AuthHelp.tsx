import { Box, Link, Typography } from "@mui/material";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";

export default function AuthHelp() {
  return (
    <Box
      sx={{
        mt: 3,
        pt: 2.5,
        borderTop: "1px solid rgba(11,44,52,0.08)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          p: 2,
          borderRadius: 2,
          bgcolor: "#F4F7F8",
          border: "1px solid rgba(11,44,52,0.06)",
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#0B2C34",
            color: "#fff",
          }}
        >
          <SupportAgentRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box minWidth={0}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#0B2C34",
              mb: 0.5,
            }}
          >
            Need help?
          </Typography>
          <Typography
            sx={{
              fontSize: 12.5,
              lineHeight: 1.55,
              color: "#5A6A72",
              mb: 1.35,
            }}
          >
            If you are facing any technical issues or looking for help, please reach out to us.
          </Typography>
          <Box display="grid" gap={0.75}>
            <Link
              href="mailto:Admissions@adityaeducationalsociety.org"
              underline="hover"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#0B2C34",
                wordBreak: "break-all",
              }}
            >
              <EmailOutlinedIcon sx={{ fontSize: 15, color: "#C45C3A" }} />
              Admissions@adityaeducationalsociety.org
            </Link>
            <Link
              href="tel:+917995547773"
              underline="hover"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#0B2C34",
              }}
            >
              <CallOutlinedIcon sx={{ fontSize: 15, color: "#C45C3A" }} />
              +91-7995547773 / +91-7995567773
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

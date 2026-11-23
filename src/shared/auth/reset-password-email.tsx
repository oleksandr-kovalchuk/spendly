import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "react-email";

import type { Locale } from "@/i18n/routing";

type ResetPasswordEmailProps = {
  link: string;
  locale: Locale;
  texts: { preview: string; heading: string; body: string; action: string; ignore: string };
};

// Email clients drop stylesheets and CSS variables: inline styles, the light theme's colors
const BODY_STYLE = {
  backgroundColor: "#ffffff",
  color: "#0a0a0a",
  fontFamily: "Arial, sans-serif",
};
const CONTAINER_STYLE = { maxWidth: "480px", padding: "24px" };
const BUTTON_STYLE = {
  backgroundColor: "#06776a",
  borderRadius: "8px",
  color: "#ffffff",
  fontWeight: 600,
  padding: "12px 20px",
};
const MUTED_STYLE = { color: "#525252", fontSize: "14px" };

export function ResetPasswordEmail({ link, locale, texts }: ResetPasswordEmailProps) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{texts.preview}</Preview>
      <Body lang={locale} style={BODY_STYLE}>
        <Container style={CONTAINER_STYLE}>
          <Heading as="h1">{texts.heading}</Heading>
          <Text>{texts.body}</Text>
          <Button href={link} style={BUTTON_STYLE}>
            {texts.action}
          </Button>
          <Text style={MUTED_STYLE}>{texts.ignore}</Text>
        </Container>
      </Body>
    </Html>
  );
}

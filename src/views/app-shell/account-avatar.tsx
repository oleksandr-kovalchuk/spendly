import { cva } from "class-variance-authority";

const avatarVariants = cva(
  "grid shrink-0 place-items-center rounded-full bg-aurora font-semibold text-aurora-foreground",
  { variants: { size: { default: "size-8 text-sm", lg: "size-10 text-base" } } },
);

// Decorative: the email next to it names the account
export function AccountAvatar({
  email,
  size = "default",
}: {
  email: string;
  size?: "default" | "lg";
}) {
  return (
    <span aria-hidden="true" className={avatarVariants({ size })}>
      {email.charAt(0).toUpperCase()}
    </span>
  );
}

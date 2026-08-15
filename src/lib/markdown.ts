export function renderMarkdown(text: string): string {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")

  let out = escapeHtml(text)

  out = out.replace(/`([^`]+)`/g, "<code class=\"rounded bg-muted px-1 py-0.5 text-[12px]\">$1</code>")
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>")
  out = out.replace(/\n/g, "<br/>")

  return out
}

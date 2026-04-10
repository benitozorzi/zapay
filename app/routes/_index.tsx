import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/auth/login?shop=${encodeURIComponent(url.searchParams.get("shop") ?? "")}`);
  }

  throw redirect("/app");
}

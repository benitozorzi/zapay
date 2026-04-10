import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";

import { login } from "../shopify.server";

type ActionData = {
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    throw await login(shop, request);
  }

  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const shop = formData.get("shop");

  if (typeof shop !== "string" || !shop.trim()) {
    return json<ActionData>(
      { error: "Informe a loja Shopify para continuar." },
      { status: 400 },
    );
  }

  throw await login(shop.trim(), request);
}

export default function AuthLoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#f6f6f7",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 12,
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Entrar no Zapay</h1>
        <p>Informe a sua loja Shopify para iniciar a autenticação do app embedded.</p>

        <Form method="post">
          <label htmlFor="shop" style={{ display: "block", marginBottom: 8 }}>
            Loja Shopify
          </label>
          <input
            id="shop"
            name="shop"
            type="text"
            placeholder="sua-loja.myshopify.com"
            style={{
              width: "100%",
              height: 44,
              borderRadius: 8,
              border: "1px solid #c9cccf",
              padding: "0 12px",
              marginBottom: 12,
            }}
          />

          {actionData?.error ? (
            <p style={{ color: "#8e1f0b", marginTop: 0 }}>{actionData.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              height: 44,
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
              background: "#111827",
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            {isSubmitting ? "Conectando..." : "Conectar loja"}
          </button>
        </Form>
      </div>
    </main>
  );
}

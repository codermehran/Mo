import Head from "next/head";

export default function Home() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  return (
    <>
      <Head>
        <title>Beauty Platform</title>
        <meta name="description" content="Beauty Platform starter" />
      </Head>
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h1>Beauty Platform Frontend</h1>
        <p>
          Connects to backend at: <strong>{apiBaseUrl}</strong>
        </p>
        <p>
          Update <code>.env</code> or <code>.env.local</code> to point at your API.
        </p>
      </main>
    </>
  );
}

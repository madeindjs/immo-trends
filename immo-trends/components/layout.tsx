import Head from "next/head";
import Link from "next/link";

interface Props {
  content: JSX.Element;
}

export function Layout({ content }: Props) {
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css"></link>
      </Head>

      <nav>
        <ul>
          <li>
            <strong>
              <Link href="/">DVF Viewver</Link>
            </strong>
          </li>
        </ul>
        <ul>
          <li>
            <Link href="/about">à propos</Link>
          </li>
        </ul>
      </nav>

      <main className="container">{content}</main>
    </div>
  );
}
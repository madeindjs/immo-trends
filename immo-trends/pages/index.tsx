import Link from "next/link";
import { Layout } from "../components/layout";
import { getZipCode } from "../services/zip-code";

interface Props {
  zipCodes: string[];
}

export default function Home({ zipCodes }: Props) {
  return (
    <Layout
      content={
        <div>
          <h1>Home</h1>

          <h2>Code postaux</h2>

          <ul>
            {zipCodes.map((zipCode) => (
              <li>
                <Link href={`/zip-code/${zipCode}`}>{zipCode}</Link>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}

export async function getStaticProps(): Promise<{ props: Props }> {
  const zipCodes = await getZipCode();

  return { props: { zipCodes } };
}

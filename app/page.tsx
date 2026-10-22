import { Breadcrumbs } from "@svenskamodellen/components/Breadcrumb";
import { Container } from "@svenskamodellen/components/Container";
import { Main } from "@svenskamodellen/components/Main";
import { TopLevelHeading } from "@svenskamodellen/components/TopLevelHeading";
import { Metadata } from "next";
import { loadAgreements } from "@/lib/agreements";
import { ThumbnailRow, ThumbnailRowList } from "@/components/ThumbnailCard";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Kollektivavtalsarkivet ${process.env.NEXT_PUBLIC_YEAR}`,
  };
}

export default async function Home() {
  const agreements = await loadAgreements(process.env.SOURCE_DIRECTORY_PATH!);

  return (
    <>
      <Breadcrumbs>
        {{
          "https://svenskamodellen.github.io/": "Svenska modellen",
          "/": "Kollektivavtal",
          [`/${process.env.NEXT_PUBLIC_YEAR}`]: `${process.env.NEXT_PUBLIC_YEAR}`,
        }}
      </Breadcrumbs>
      <Main>
        <Container className="flex flex-col items-start space-y-8 pb-8">
          <TopLevelHeading
            text={`Kollektivavtalsarkivet ${process.env.NEXT_PUBLIC_YEAR}`}
            subtext={`Avtal A-Ö för året ${process.env.NEXT_PUBLIC_YEAR}`}
          />

          <section className="flex w-full flex-col items-start space-y-8">
            <ThumbnailRowList>
              {agreements
                .filter((agreement) => agreement.documents.length > 0)
                .map((agreement) => (
                  <ThumbnailRow
                    key={agreement.slug}
                    href={`/${process.env.NEXT_PUBLIC_YEAR}/${agreement.slug}`}
                    src={`/${process.env.NEXT_PUBLIC_YEAR}/${agreement.documents[0].thumbnails.w320}`}
                    title={agreement.name}
                    description={`${agreement.documents.length} dokument`}
                  />
                ))}
            </ThumbnailRowList>
          </section>
        </Container>
      </Main>
    </>
  );
}

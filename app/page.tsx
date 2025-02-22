import { Breadcrumbs } from "@arbetsmarknad/components/Breadcrumb";
import {
  DocumentList,
  DocumentItem,
  DocumentIcon,
  DocumentLink,
  DocumentDescription,
} from "@arbetsmarknad/components/DocumentList";
import { Container } from "@arbetsmarknad/components/Container";
import { Main } from "@arbetsmarknad/components/Main";
import { TopLevelHeading } from "@arbetsmarknad/components/TopLevelHeading";
import { Metadata } from "next";
import { loadAgreements } from "@/lib/agreements";

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
          "https://arbetsmarknad.codeberg.page/": "Arbetsmarknad",
          "/": "Kollektivavtal",
          [`/${process.env.NEXT_PUBLIC_YEAR}`]: `${process.env.NEXT_PUBLIC_YEAR}`,
        }}
      </Breadcrumbs>
      <Main>
        <Container className="flex flex-col items-start space-y-8">
          <TopLevelHeading
            text={`Kollektivavtalsarkivet ${process.env.NEXT_PUBLIC_YEAR}`}
          />

          <section className="flex flex-col items-start space-y-4">
            <h2 className="text-2xl font-bold">Senaste Avtal</h2>
            <DocumentList>
              {agreements.map((agreement) => (
                <DocumentItem key={agreement.slug}>
                  <DocumentIcon
                    src={`/${process.env.NEXT_PUBLIC_YEAR}/${agreement.documents[0].thumbnails.w64}`}
                  />
                  <DocumentLink
                    href={`/${process.env.NEXT_PUBLIC_YEAR}/${agreement.slug}`}
                  >
                    {agreement.name}
                  </DocumentLink>
                  <DocumentDescription>
                    {`${agreement.documents.length} dokument`}
                  </DocumentDescription>
                </DocumentItem>
              ))}
            </DocumentList>
          </section>
        </Container>
      </Main>
    </>
  );
}

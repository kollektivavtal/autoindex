import { Breadcrumbs } from "@svenskamodellen/components/Breadcrumb";
import { Container } from "@svenskamodellen/components/Container";
import { LinkList } from "@/components/LinkList";
import { Main } from "@svenskamodellen/components/Main";
import { Section } from "@svenskamodellen/components/Section";
import { SectionHeading } from "@svenskamodellen/components/SectionHeading";
import { TopLevelHeading } from "@svenskamodellen/components/TopLevelHeading";
import { loadAgreement, loadAgreements } from "@/lib/agreements";
import { Agreement } from "@/lib/agreements";
import { ThumbnailRow, ThumbnailRowList } from "@/components/ThumbnailCard";
import { Metadata } from "next";

type AgreementParams = {
  slug: string;
};

type AgreementProps = {
  params: Promise<AgreementParams>;
};

async function loadRouteAgreement(slug: string): Promise<Agreement> {
  const agreements = await loadAgreements(process.env.SOURCE_DIRECTORY_PATH!);
  const agreement = agreements.find((candidate) => candidate.slug === slug);

  if (!agreement) {
    throw new Error(`Unknown agreement slug: ${slug}`);
  }

  return agreement.redirectTo
    ? agreement
    : loadAgreement(process.env.SOURCE_DIRECTORY_PATH!, slug);
}

export async function generateStaticParams(): Promise<AgreementParams[]> {
  const agreements = await loadAgreements(process.env.SOURCE_DIRECTORY_PATH!);
  return agreements.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  props: AgreementProps,
): Promise<Metadata> {
  const params = await props.params;
  const agreement = await loadRouteAgreement(params.slug);
  return {
    title: `${agreement.name} ${process.env.NEXT_PUBLIC_YEAR}`,
  };
}

export default async function AgreementPage(props: AgreementProps) {
  const params = await props.params;
  const agreement = await loadRouteAgreement(params.slug);

  if (agreement.redirectTo) {
    return (
      <meta
        httpEquiv="refresh"
        content={`0;url=/${process.env.NEXT_PUBLIC_YEAR}/${agreement.redirectTo}/`}
      />
    );
  }

  return (
    <>
      <Breadcrumbs>
        {{
          "https://svenskamodellen.github.io/": "Svenska modellen",
          "/": "Kollektivavtal",
          [`/${process.env.NEXT_PUBLIC_YEAR}`]: `${process.env.NEXT_PUBLIC_YEAR}`,
          [`/${process.env.NEXT_PUBLIC_YEAR}/${agreement.slug}`]:
            agreement.name,
        }}
      </Breadcrumbs>
      <Main>
        <Container className="flex flex-col items-start space-y-12 pb-16">
          <TopLevelHeading
            text={`${agreement.name} ${process.env.NEXT_PUBLIC_YEAR}`}
          />

          <Section className="w-full overflow-visible">
            <SectionHeading>Dokument</SectionHeading>
            <ThumbnailRowList>
              {agreement.documents.map((document) => (
                <ThumbnailRow
                  key={document.rank}
                  href={`/${process.env.NEXT_PUBLIC_YEAR}/${document.filename}`}
                  src={`/${process.env.NEXT_PUBLIC_YEAR}/${document.thumbnails.w320}`}
                  title={document.name}
                  description={["PDF", `${(document.bytes / 1024).toFixed(2)} KB`].join(", ")}
                />
              ))}
            </ThumbnailRowList>
          </Section>

          {agreement.sources.length > 0 ? (
            <Section>
              <SectionHeading>Källor</SectionHeading>
              <LinkList links={agreement.sources} />
            </Section>
          ) : (
            <></>
          )}
        </Container>
      </Main>
    </>
  );
}

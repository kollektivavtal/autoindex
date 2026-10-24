import { Breadcrumbs } from "@svenskamodellen/components/Breadcrumb";
import { Container } from "@svenskamodellen/components/Container";
import { LinkList } from "@/components/LinkList";
import { Main } from "@svenskamodellen/components/Main";
import { Section } from "@svenskamodellen/components/Section";
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
        <Container className="flex flex-col items-start space-y-8 pb-8">
          <TopLevelHeading
            text={`${agreement.name} ${process.env.NEXT_PUBLIC_YEAR}`}
          />

          <Section className="w-full overflow-visible">
            <h2 className="section-heading">Dokument</h2>
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

          {agreement.forbund.length > 0 ? (
            <Section className="w-full overflow-visible">
              <h2 className="section-heading">Förbund</h2>
              <ul className="flex w-full flex-col gap-y-4">
                {agreement.forbund.map((forbund) => (
                  <li key={forbund.url} className="max-w-prose">
                    <a
                      className="group flex items-center gap-x-3"
                      href={forbund.url}
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-white p-1.5 shadow-sm ring-1 ring-black/5 transition-shadow duration-150 group-hover:shadow-md dark:ring-white/40">
                        <img
                          alt=""
                          className="h-full w-full object-contain"
                          src={forbund.logo}
                        />
                      </div>
                      <span className="flex flex-col">
                        <span className="font-bold text-link underline">
                          {forbund.name}
                        </span>
                        {forbund.note && (
                          <span className="body-text text-slate-500 dark:text-slate-100">
                            {forbund.note}
                          </span>
                        )}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          ) : (
            <></>
          )}

          {agreement.sources.length > 0 ? (
            <Section>
              <h2 className="section-heading">Källor</h2>
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

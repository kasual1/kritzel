import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import Link from "@docusaurus/Link";
import CallToAction from "@site/src/components/CallToAction";

import styles from "./pricing.module.css";

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonLabel: string;
  buttonLink: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Hobby",
    price: "Free",
    description: "Perfect for personal projects and open source applications.",
    features: [
      "Unlimited canvas size",
      "All drawing tools included",
      "Full TypeScript support",
      "Framework wrappers (Angular, React, Vue)",
      "Community support",
      "MIT License",
    ],
    buttonLabel: "Get Started",
    buttonLink: "/docs/angular/overview",
  },
  {
    name: "Startup",
    price: "$249",
    description: "For teams building commercial applications.",
    features: [
      "Everything in Open Source",
      "Real-time collaboration",
      "Priority email support",
      "Private Discord channel",
      "Early access to new features",
      "Commercial license",
    ],
    highlighted: true,
    buttonLabel: "Join Waitlist",
    buttonLink: "mailto:contact@kritzel.dev?subject=Kritzel%20Startup%20Plan%20Waitlist",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations with advanced requirements.",
    features: [
      "Everything in Pro",
      "Dedicated support engineer",
      "Custom feature development",
      "SLA guarantees",
      "Security review & compliance",
      "On-premise deployment option",
    ],
    buttonLabel: "Contact Us",
    buttonLink: "mailto:contact@kritzel.dev",
  },
];

function PricingCard({ tier }: { tier: PricingTier }): ReactNode {
  return (
    <div className={`${styles.pricingCard} ${tier.highlighted ? styles.highlighted : ""}`}>
      {tier.highlighted && <div className={styles.popularBadge}>Most Popular</div>}
      <div className={styles.cardHeader}>
        <Heading as="h3" className={styles.tierName}>{tier.name}</Heading>
        <div className={styles.priceContainer}>
          <span className={styles.price}>{tier.price}</span>
          {tier.price !== "Free" && tier.price !== "Custom" && (
            <span className={styles.pricePeriod}>/month</span>
          )}
        </div>
        <p className={styles.tierDescription}>{tier.description}</p>
      </div>
      <ul className={styles.featuresList}>
        {tier.features.map((feature, index) => (
          <li key={index} className={styles.featureItem}>
            <span className={styles.checkmark}>✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        to={tier.buttonLink}
        className={`button button--lg ${tier.highlighted ? "button--primary" : "button--secondary"} ${styles.tierButton}`}
      >
        {tier.buttonLabel}
      </Link>
    </div>
  );
}

export default function Pricing(): ReactNode {
  return (
    <Layout title="Pricing" description="Simple, transparent pricing for Kritzel">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.headerTitle}>
            Simple, Transparent Pricing
          </Heading>
          <p className={styles.headerSubtitle}>
            Start free, upgrade when you need more
          </p>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.pricingContainer}>
          {pricingTiers.map((tier, index) => (
            <PricingCard key={index} tier={tier} />
          ))}
        </div>

        <section className={styles.faqSection}>
          <div className={styles.container}>
            <Heading as="h2" className={styles.sectionTitle}>Frequently Asked Questions</Heading>
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <Heading as="h3" className={styles.faqQuestion}>Is Kritzel really free?</Heading>
                <p className={styles.faqAnswer}>
                  Yes! The core library is completely free and open source under the MIT license. 
                  You can use it in personal and commercial projects without any cost.
                </p>
              </div>
              <div className={styles.faqItem}>
                <Heading as="h3" className={styles.faqQuestion}>What's included in Pro?</Heading>
                <p className={styles.faqAnswer}>
                  Pro includes real-time collaboration features, priority support, and a commercial 
                  license for teams building production applications.
                </p>
              </div>
              <div className={styles.faqItem}>
                <Heading as="h3" className={styles.faqQuestion}>Can I switch plans later?</Heading>
                <p className={styles.faqAnswer}>
                  Absolutely! You can upgrade or downgrade your plan at any time. Changes take 
                  effect at the start of your next billing cycle.
                </p>
              </div>
              <div className={styles.faqItem}>
                <Heading as="h3" className={styles.faqQuestion}>Do you offer discounts?</Heading>
                <p className={styles.faqAnswer}>
                  We offer discounts for startups, educational institutions, and non-profit 
                  organizations. Contact us to learn more.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CallToAction
          title="Ready to get started?"
          description="Join thousands of developers building with Kritzel."
          primaryButton={{ label: "Start Building", to: "/docs/angular/overview", showArrow: true }}
          secondaryButton={{ label: "View on GitHub", to: "https://github.com/kasual1/kritzel" }}
        />
      </main>
    </Layout>
  );
}

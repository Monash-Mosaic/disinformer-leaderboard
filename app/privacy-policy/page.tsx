import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Disinformer",
  description: "Privacy Policy for the Disinformer mobile application.",
};

const linkClass =
  "font-semibold text-[#317070] underline decoration-2 underline-offset-4 hover:text-[#ff4805] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff4805]";

const listClass = "mt-3 list-disc space-y-2 pl-6 marker:text-[#ff4805]";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-[calc(100vh-12rem)] bg-[#ffffef] px-4 py-8 text-[#2d4143] sm:px-6 sm:py-12 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <header className="border-b-4 border-[#2d4143] pb-7 sm:pb-9">
          <p className="mb-3 font-['Play'] text-sm font-bold uppercase tracking-[0.18em] text-[#ff4805]">
            Monash Mosaic
          </p>
          <h1 className="text-3xl leading-tight [font-family:var(--font-bungee-shade)] sm:text-4xl md:text-5xl">
            Privacy Policy for Disinformer
          </h1>
          <p className="mt-4 text-base font-bold sm:text-lg">
            Last updated: 2 September 2026
          </p>
        </header>

        <div className="space-y-9 py-8 text-base leading-7 sm:py-10 sm:text-lg sm:leading-8">
          <p>
            This Privacy Policy explains how Monash Mosaic (“we”, “us”, or
            “our”) collects, uses, stores, and protects information when you use
            the Disinformer mobile application (“Disinformer” or the “App”).
          </p>

          <section aria-labelledby="information-we-collect">
            <h2 id="information-we-collect" className="text-2xl font-bold sm:text-3xl">
              1. Information We Collect
            </h2>

            <h3 className="mt-5 text-xl font-bold">Player profile information</h3>
            <p className="mt-2">When a player is registered in the App, we may collect:</p>
            <ul className={listClass}>
              <li>A username chosen by the player</li>
              <li>The player’s selected IFRC National Society</li>
              <li>A selected in-game avatar</li>
              <li>Player creation and last-played timestamps</li>
            </ul>
            <p className="mt-4">
              Users should not use their real name or include sensitive personal
              information in their username.
            </p>

            <h3 className="mt-6 text-xl font-bold">Gameplay information</h3>
            <p className="mt-2">
              We may collect information generated while the App is used,
              including:
            </p>
            <ul className={listClass}>
              <li>Scores and points</li>
              <li>Number of games played</li>
              <li>Game roles and results</li>
              <li>Elimination status</li>
              <li>Selected topics and game settings</li>
              <li>Game start and end times</li>
              <li>Number of rounds and players</li>
              <li>Survey responses and records of completed surveys</li>
              <li>Randomly generated game or group identifiers</li>
            </ul>
            <p className="mt-4">
              This information is used to operate the game, maintain player
              statistics, display leaderboards, evaluate gameplay, and improve
              the App.
            </p>

            <h3 className="mt-6 text-xl font-bold">Analytics and technical information</h3>
            <p className="mt-2">
              We use Google Analytics for Firebase to understand how the App is
              used and to identify performance or usability issues. Analytics
              information may include:
            </p>
            <ul className={listClass}>
              <li>App opens and interactions</li>
              <li>Gameplay events and selected features</li>
              <li>Session and game identifiers</li>
              <li>Device type and model</li>
              <li>Operating system and App version</li>
              <li>App installation or instance identifiers</li>
              <li>General regional information derived by the analytics provider</li>
              <li>Other diagnostic and usage information automatically collected by Firebase</li>
            </ul>
            <p className="mt-4">
              Some analytics events may include a player’s chosen username, such
              as when recording a survey response.
            </p>
            <p className="mt-4">
              Disinformer does not request or collect precise GPS location data.
            </p>

            <h3 className="mt-6 text-xl font-bold">Information stored on the device</h3>
            <p className="mt-2">
              Some player and analytics information may be temporarily stored on
              the user’s device to support offline use, caching, and later
              synchronisation with Firebase.
            </p>
          </section>

          <section aria-labelledby="information-not-required">
            <h2 id="information-not-required" className="text-2xl font-bold sm:text-3xl">
              2. Information We Do Not Require
            </h2>
            <p className="mt-3">Disinformer does not require:</p>
            <ul className={listClass}>
              <li>An email address</li>
              <li>A password</li>
              <li>A phone number</li>
              <li>Access to the user’s Google Account</li>
              <li>Precise GPS location</li>
              <li>Payment or financial information</li>
            </ul>
            <p className="mt-4">
              Disinformer does not use Firebase Authentication. A player profile
              is identified by its chosen username and is not protected by a
              password or other identity-verification method.
            </p>
          </section>

          <section aria-labelledby="how-we-use-information">
            <h2 id="how-we-use-information" className="text-2xl font-bold sm:text-3xl">
              3. How We Use Information
            </h2>
            <p className="mt-3">We use collected information to:</p>
            <ul className={listClass}>
              <li>Register and identify players within the App</li>
              <li>Retrieve existing player profiles</li>
              <li>Operate game sessions</li>
              <li>Calculate scores and update player statistics</li>
              <li>Display usernames and statistics on leaderboards</li>
              <li>Record survey participation and responses</li>
              <li>Support offline functionality</li>
              <li>Monitor App usage and performance</li>
              <li>Investigate errors, misuse, and technical problems</li>
              <li>Evaluate and improve the game and related educational activities</li>
            </ul>
            <p className="mt-4">
              We do not sell personal information or use it for third-party advertising.
            </p>
          </section>

          <section aria-labelledby="publicly-visible-information">
            <h2 id="publicly-visible-information" className="text-2xl font-bold sm:text-3xl">
              4. Publicly Visible Information
            </h2>
            <p className="mt-3">
              A player’s chosen username and associated gameplay statistics may
              be displayed to other users or on a public leaderboard.
            </p>
            <p className="mt-4">
              A selected IFRC National Society may also be displayed where it is
              relevant to a player profile or leaderboard.
            </p>
            <p className="mt-4">
              Players should choose a username that does not reveal their real
              identity or other sensitive personal information.
            </p>
          </section>

          <section aria-labelledby="firebase-third-party-services">
            <h2 id="firebase-third-party-services" className="text-2xl font-bold sm:text-3xl">
              5. Firebase and Third-Party Services
            </h2>
            <p className="mt-3">
              Disinformer uses services provided by Google LLC, including:
            </p>
            <ul className={listClass}>
              <li>
                Cloud Firestore, to store player profiles, gameplay records,
                IFRC society options, survey records, and related App data
              </li>
              <li>
                Google Analytics for Firebase, to collect and analyse App usage information
              </li>
            </ul>
            <p className="mt-4">
              Google processes information in accordance with its applicable
              terms and privacy practices:
            </p>
            <ul className={listClass}>
              <li>
                <a
                  className={linkClass}
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a
                  className={linkClass}
                  href="https://firebase.google.com/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Firebase Privacy and Security
                </a>
              </li>
            </ul>
            <p className="mt-4">
              Authorised project personnel may access information where
              reasonably necessary to operate, maintain, evaluate, secure, or
              improve Disinformer.
            </p>
          </section>

          <section aria-labelledby="ifrc-data-protection">
            <h2 id="ifrc-data-protection" className="text-2xl font-bold sm:text-3xl">
              6. IFRC Data Protection
            </h2>
            <p className="mt-3">
              Where applicable to the Disinformer project, information is handled
              in accordance with relevant project agreements and the IFRC Policy
              on the Protection of Personal Data.
            </p>
            <p className="mt-4">The IFRC policy is available at:</p>
            <p className="mt-2">
              <a
                className={linkClass}
                href="https://www.ifrc.org/document/IFRC-Data-Protection-Policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                IFRC Policy on the Protection of Personal Data
              </a>
            </p>
            <p className="mt-4">
              This reference does not mean that all Disinformer data is hosted
              directly by the IFRC. The App currently uses Google Firebase
              services for its cloud storage and analytics functions.
            </p>
          </section>

          <section aria-labelledby="data-storage">
            <h2 id="data-storage" className="text-2xl font-bold sm:text-3xl">
              7. Data Storage and International Processing
            </h2>
            <p className="mt-3">
              The primary production Cloud Firestore database used by
              Disinformer is configured in a European region.
            </p>
            <p className="mt-4">
              Google and its service providers may process analytics, technical,
              or service data in other countries where they operate. Those
              countries may have data-protection laws that differ from the laws
              in the user’s country.
            </p>
          </section>

          <section aria-labelledby="data-retention">
            <h2 id="data-retention" className="text-2xl font-bold sm:text-3xl">
              8. Data Retention
            </h2>
            <p className="mt-3">
              Player profiles, gameplay records, survey information, and related
              statistics are retained for as long as reasonably necessary to:
            </p>
            <ul className={listClass}>
              <li>Operate Disinformer and its leaderboards</li>
              <li>Maintain player and game records</li>
              <li>Support project evaluation and improvement</li>
              <li>Meet applicable legal, security, contractual, or IFRC project requirements</li>
            </ul>
            <p className="mt-4">
              Firebase Analytics information is retained according to the
              retention settings configured for the project and Google’s
              applicable policies.
            </p>
            <p className="mt-4">
              We may retain aggregated or de-identified information that can no
              longer reasonably be associated with an individual player.
            </p>
          </section>

          <section aria-labelledby="access-correction-deletion">
            <h2 id="access-correction-deletion" className="text-2xl font-bold sm:text-3xl">
              9. Access, Correction, and Deletion
            </h2>
            <p className="mt-3">
              Users may request access to, correction of, or deletion of
              information associated with their player profile by contacting:
            </p>
            <p className="mt-2">
              <a className={linkClass} href="mailto:mosaic@monash.edu">
                mosaic@monash.edu
              </a>
            </p>
            <p className="mt-4">
              Please use the subject line “Disinformer Data Request” and provide
              the relevant username and selected IFRC National Society so that we
              can locate the appropriate record. Do not send passwords,
              identification documents, or other sensitive information.
            </p>
            <p className="mt-4">
              Because Disinformer does not use passwords or identity
              verification, we may need to take reasonable steps to avoid
              deleting the wrong player record.
            </p>
            <p className="mt-4">
              Removing a player from a device or uninstalling the App may remove
              locally stored information, but it may not automatically remove
              information already stored in Cloud Firestore. Users should contact
              us to request deletion of cloud-stored information.
            </p>
            <p className="mt-4">
              Some information may be retained where reasonably required for
              security, fraud prevention, legal compliance, contractual
              requirements, or to protect the integrity of aggregated project
              records. Where possible, retained information will be de-identified.
            </p>
          </section>

          <section aria-labelledby="data-security">
            <h2 id="data-security" className="text-2xl font-bold sm:text-3xl">
              10. Data Security
            </h2>
            <p className="mt-3">
              We use reasonable technical and organisational measures to protect
              information handled through Disinformer. Data transmitted to
              Firebase is encrypted in transit using HTTPS.
            </p>
            <p className="mt-4">
              Access to project systems and administrative tools is limited to
              authorised personnel. However, no electronic storage or
              transmission method can be guaranteed to be completely secure.
            </p>
          </section>

          <section aria-labelledby="childrens-privacy">
            <h2 id="childrens-privacy" className="text-2xl font-bold sm:text-3xl">
              11. Children’s Privacy
            </h2>
            <p className="mt-3">Disinformer is not intended for children under 13.</p>
            <p className="mt-4">
              We do not knowingly collect personal information from children
              under 13. If a parent or guardian believes that a child has
              provided personal information through the App, they may contact us
              at <a className={linkClass} href="mailto:mosaic@monash.edu">mosaic@monash.edu</a> to request its deletion.
            </p>
            <p className="mt-4">
              If Disinformer is offered to younger users through a supervised
              educational activity, the responsible organisation must ensure
              that appropriate consent and safeguards are in place.
            </p>
          </section>

          <section aria-labelledby="policy-changes">
            <h2 id="policy-changes" className="text-2xl font-bold sm:text-3xl">
              12. Changes to This Privacy Policy
            </h2>
            <p className="mt-3">
              We may update this Privacy Policy when the App, its data practices,
              or applicable requirements change.
            </p>
            <p className="mt-4">
              The updated policy will be published with a revised “Last updated”
              date. Users should review this policy periodically.
            </p>
          </section>

          <section aria-labelledby="contact-us">
            <h2 id="contact-us" className="text-2xl font-bold sm:text-3xl">
              13. Contact Us
            </h2>
            <p className="mt-3">For privacy questions, concerns, or data requests, contact:</p>
            <address className="mt-3 not-italic">
              <p className="font-bold">Monash Mosaic</p>
              <p>
                Email:{" "}
                <a className={linkClass} href="mailto:mosaic@monash.edu">
                  mosaic@monash.edu
                </a>
              </p>
            </address>
          </section>
        </div>
      </article>
    </main>
  );
}

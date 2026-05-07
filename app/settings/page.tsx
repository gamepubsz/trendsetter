import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { getMissingCriticalEnv } from "@/lib/env";
import { securityControls, tokenPolicies } from "@/lib/mock-data";

export default function SettingsPage() {
  const missingEnv = getMissingCriticalEnv();

  return (
    <AppShell
      title="Settings and safeguards"
      description="Keep token usage low, validate critical configuration, and establish secure integration defaults."
    >
      <div className="grid cols-2">
        <SectionCard
          title="Security controls"
          description="Baseline checks for a monetized multi-channel operating system."
        >
          <div className="list">
            {securityControls.map((control) => (
              <article key={control.name} className="list-item">
                <h4>
                  {control.name} · <span className="score">{control.status}</span>
                </h4>
                <p className="muted">{control.detail}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Environment readiness"
          description="Fill the variables in .env before wiring live APIs."
        >
          {missingEnv.length > 0 ? (
            <div className="list">
              {missingEnv.map((key) => (
                <article key={key} className="list-item">
                  <strong>{key}</strong>
                  <p className="muted">Required before enabling live sync and OAuth flows.</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Critical environment values are present.</p>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: 24 }}>
        <SectionCard
          title="Token budget policies"
          description="Reserve larger context windows for only the highest-value tasks."
        >
          <table className="table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Model tier</th>
                <th>Input cap</th>
                <th>Output cap</th>
                <th>Cache TTL</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {tokenPolicies.map((policy) => (
                <tr key={policy.stage}>
                  <td>{policy.stage}</td>
                  <td>{policy.modelTier}</td>
                  <td>{policy.maxInputTokens}</td>
                  <td>{policy.maxOutputTokens}</td>
                  <td>{policy.cacheTtlMinutes} min</td>
                  <td>{policy.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </AppShell>
  );
}

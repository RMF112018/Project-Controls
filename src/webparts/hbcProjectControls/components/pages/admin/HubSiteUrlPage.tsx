import * as React from 'react';
import { Input, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcField } from '../../shared/HbcField';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { AuditAction, EntityType } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
    maxWidth: '640px',
  },
  form: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center',
  },
  validationSuccess: {
    fontSize: '13px',
    color: tokens.colorStatusSuccessForeground2,
  },
  validationError: {
    fontSize: '13px',
    color: tokens.colorStatusDangerForeground2,
  },
});

export const HubSiteUrlPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [validationMessage, setValidationMessage] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<'valid' | 'invalid' | null>(null);

  React.useEffect(() => {
    dataService.getHubSiteUrl()
      .then(result => setUrl(result))
      .catch(() => setUrl(''))
      .finally(() => setLoading(false));
  }, [dataService]);

  const validateUrl = React.useCallback((value: string): boolean => {
    if (!value.trim()) {
      setValidationMessage('URL is required.');
      return false;
    }
    if (!value.startsWith('https://')) {
      setValidationMessage('URL must start with https://');
      return false;
    }
    setValidationMessage(null);
    return true;
  }, []);

  const handleTest = React.useCallback(() => {
    setTesting(true);
    setTestResult(null);

    const isValid = validateUrl(url);
    // Simulate a brief network check
    window.setTimeout(() => {
      setTestResult(isValid ? 'valid' : 'invalid');
      setTesting(false);
    }, 500);
  }, [url, validateUrl]);

  const handleSave = React.useCallback(async () => {
    if (!validateUrl(url)) {
      return;
    }

    setSaving(true);
    try {
      await dataService.setHubSiteUrl(url);
      await dataService.logAudit({
        Action: AuditAction.SupportConfigUpdated,
        EntityType: EntityType.Config,
        EntityId: 'hub-site-url',
        User: currentUser?.email ?? 'unknown',
        Details: `Hub site URL updated to ${url}`,
      });
      addToast('Hub site URL saved successfully.', 'success');
      setTestResult(null);
    } catch {
      addToast('Failed to save hub site URL.', 'error');
    } finally {
      setSaving(false);
    }
  }, [url, validateUrl, dataService, currentUser, addToast]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Hub Site URL" />
        <div className={styles.container}>
          <HbcSkeleton variant="form" rows={2} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Hub Site URL" subtitle="Configure the root SharePoint hub site URL for the application." />
      <div className={styles.container}>
        <div className={styles.form}>
          <HbcField
            label="Hub Site URL"
            required
            validationMessage={validationMessage ?? undefined}
          >
            <Input
              value={url}
              onChange={(_, data) => {
                setUrl(data.value);
                setValidationMessage(null);
                setTestResult(null);
              }}
              placeholder="https://yourtenant.sharepoint.com/sites/hub"
            />
          </HbcField>

          <div className={styles.actions}>
            <HbcButton isLoading={testing} onClick={handleTest}>
              Test
            </HbcButton>
            <HbcButton emphasis="strong" isLoading={saving} onClick={handleSave}>
              Save
            </HbcButton>
            {testResult === 'valid' && (
              <span className={styles.validationSuccess}>URL is valid</span>
            )}
            {testResult === 'invalid' && (
              <span className={styles.validationError}>URL is invalid</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

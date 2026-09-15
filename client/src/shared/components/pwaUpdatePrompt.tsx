import { useRegisterSW } from 'virtual:pwa-register/react';
import { Snackbar, Button } from '@mui/material';

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <Snackbar
      open={needRefresh}
      message="New version available!"
      action={
        <>
          <Button color="secondary" size="small" onClick={() => updateServiceWorker(true)}>
            Update
          </Button>
          <Button size="small" onClick={() => setNeedRefresh(false)}>
            Later
          </Button>
        </>
      }
    />
  );
}
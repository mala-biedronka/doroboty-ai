import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePostHog } from "@posthog/react";
import {
  currentPerson,
  initialState,
  transition,
  type Action,
  type Person,
  type State,
} from "./model";
import { parseState, readState, saveState, type StoragePort } from "./storage";

const posthogEnabled = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
);
function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function useStore() {
  const posthog = usePostHog();
  const [loaded] = useState(() => readState(browserStorage()));
  const [state, setState] = useState(loaded.state);
  const [issue, setIssue] = useState(loaded.issue);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(loaded.blocked);
  const latest = useRef(state);
  const restoredIdentity = useRef(false);
  const identifyPerson = useCallback(
    (person: Person) => {
      if (!posthogEnabled) return;
      posthog.identify(person.id, {
        name: person.name,
        role: person.role,
        ...(person.companyId ? { company_id: person.companyId } : {}),
      });
    },
    [posthog],
  );
  function syncIdentity(next: State) {
    const previousPerson = currentPerson(latest.current);
    const nextPerson = currentPerson(next);
    if (previousPerson?.id === nextPerson?.id) return;
    if (previousPerson && posthogEnabled) posthog.reset();
    if (nextPerson) identifyPerson(nextPerson);
  }
  function commit(next: State, replace = false) {
    latest.current = next;
    setState(next);
    setError("");
    if (blocked && !replace) return;
    try {
      saveState(browserStorage(), next);
      setIssue("");
      if (replace) setBlocked(false);
    } catch (e) {
      setIssue((e as Error).message);
    }
  }
  function run(action: Action) {
    try {
      const next = transition(latest.current, action);
      if (action.type === "select_person") syncIdentity(next);
      commit(next);
      return true;
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Sprawdź poprawność i długość wprowadzonych danych.",
      );
      return false;
    }
  }
  function importState(raw: string) {
    try {
      const next = parseState(raw);
      syncIdentity(next);
      commit(next, true);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  useEffect(() => {
    const restoredPerson = currentPerson(loaded.state);
    if (!restoredIdentity.current && restoredPerson) {
      identifyPerson(restoredPerson);
      restoredIdentity.current = true;
    }
  }, [identifyPerson, loaded.state]);
  function reset() {
    const next = initialState();
    syncIdentity(next);
    commit(next, true);
  }
  return {
    state,
    issue,
    error,
    blocked,
    original: loaded.original,
    run,
    importState,
    clearError: () => setError(""),
    reset,
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}

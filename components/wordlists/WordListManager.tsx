"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PageIntro } from "@/components/ui/PageIntro";
import {
  api,
  toProblem,
  type NewWord,
  type Problem,
  type WordDto,
  type WordListDetail,
  type WordListSummary,
} from "@/lib/client-api";
import { plural } from "@/lib/format";
import { ipaWord } from "@/lib/phonemes";
import { BulkImport } from "./BulkImport";
import type { ListFormValues } from "./ListDetailsForm";
import { ListHeader } from "./ListHeader";
import { ListSidebar } from "./ListSidebar";
import { WordEditor } from "./WordEditor";
import { WordTable } from "./WordTable";

const gap = { gap: "var(--density-gap, 1.5rem)" };

/**
 * The Word Lists page: full create, read, update and delete for word lists
 * and the words inside them. Every change goes through the API and the page
 * reloads from the server afterwards, so what you see is what is stored.
 */
export function WordListManager({ initialListId }: { initialListId?: number }) {
  const [lists, setLists] = useState<WordListSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(initialListId ?? null);
  const [detail, setDetail] = useState<WordListDetail | null>(null);
  const [editing, setEditing] = useState<WordDto | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [notice, setNotice] = useState("");

  // Load the lists once, then show the requested list or the first one.
  useEffect(() => {
    let cancelled = false;
    api
      .listWordLists()
      .then((data) => {
        if (cancelled) return;
        setLists(data);
        setSelectedId((current) =>
          current !== null && data.some((l) => l.id === current) ? current : (data[0]?.id ?? null)
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setProblem(toProblem(e));
        setLists([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the selected list's words whenever the selection changes.
  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    api
      .getWordList(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) setProblem(toProblem(e));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Success messages clear themselves after a few seconds.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const refresh = useCallback(async (listId: number | null) => {
    const [ls, d] = await Promise.all([
      api.listWordLists(),
      listId !== null ? api.getWordList(listId) : Promise.resolve(null),
    ]);
    setLists(ls);
    setDetail(d);
  }, []);

  const current = detail && detail.id === selectedId ? detail : null;

  function selectList(id: number) {
    setSelectedId(id);
    setEditing(null);
    setProblem(null);
  }

  async function createList(values: ListFormValues) {
    const created = await api.createWordList({ name: values.name, description: values.description || null });
    setSelectedId(created.id);
    setEditing(null);
    await refresh(created.id);
    setNotice(`Created the list “${created.name}”. Add its first word below.`);
  }

  async function saveListDetails(values: ListFormValues) {
    if (!current) return;
    await api.updateWordList(current.id, { name: values.name, description: values.description || null });
    await refresh(current.id);
    setNotice("List details saved.");
  }

  async function deleteList() {
    if (!current) return;
    try {
      await api.deleteWordList(current.id);
      const remaining = await api.listWordLists();
      setLists(remaining);
      setDetail(null);
      setEditing(null);
      setSelectedId(remaining[0]?.id ?? null);
      setNotice(`Deleted “${current.name}” and its ${plural(current.words.length, "word")}.`);
    } catch (e) {
      setProblem(toProblem(e));
    }
  }

  async function saveWord(word: NewWord) {
    if (!current) return;
    if (editing) {
      const updated = await api.updateWord(editing.id, word);
      setEditing(null);
      await refresh(current.id);
      setNotice(`Saved “${updated.english}” as ${ipaWord(updated.phonemes)}.`);
    } else {
      const added = await api.addWord(current.id, word);
      await refresh(current.id);
      setNotice(`Added “${added.english}” ${ipaWord(added.phonemes)} to the list.`);
    }
  }

  async function deleteWord(word: WordDto) {
    try {
      await api.deleteWord(word.id);
      if (editing?.id === word.id) setEditing(null);
      await refresh(selectedId);
      setNotice(`Deleted “${word.english}”.`);
    } catch (e) {
      setProblem(toProblem(e));
    }
  }

  async function importWords(words: NewWord[]) {
    if (!current) return;
    const result = await api.importWords(current.id, words);
    await refresh(current.id);
    setNotice(`Imported ${plural(result.created, "word")}.`);
  }

  return (
    <>
      <PageIntro title="Word Lists">
        Create and manage the phoneme word lists that drive every Wordle and Word Search. Everything on this
        page is saved to the database through the API.
      </PageIntro>

      <ErrorAlert problem={problem} onDismiss={() => setProblem(null)} />
      <p
        role="status"
        aria-live="polite"
        className={
          notice
            ? "rounded-xl border border-border bg-accent-soft px-4 py-2 text-sm font-semibold"
            : "sr-only"
        }
      >
        {notice}
      </p>

      <div className="grid items-start lg:grid-cols-[17rem_minmax(0,1fr)]" style={gap}>
        <ListSidebar lists={lists} selectedId={selectedId} onSelect={selectList} onCreate={createList} />

        <div className="flex min-w-0 flex-col" style={gap}>
          {lists !== null && lists.length === 0 ? (
            <Card title="No word lists yet">
              <p className="text-sm text-muted">Create your first list with “New list”.</p>
            </Card>
          ) : !current ? (
            <Card>
              <p className="text-sm text-muted">Loading words…</p>
            </Card>
          ) : (
            <>
              <ListHeader list={current} onSave={saveListDetails} onDelete={deleteList} />
              <WordEditor
                key={editing ? `edit-${editing.id}` : `new-${current.id}`}
                editing={editing}
                onSave={saveWord}
                onCancel={() => setEditing(null)}
              />
              <WordTable
                words={current.words}
                editingId={editing?.id ?? null}
                onEdit={(w) => {
                  setEditing(w);
                  setProblem(null);
                }}
                onDelete={deleteWord}
              />
              <BulkImport key={`bulk-${current.id}`} onImport={importWords} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

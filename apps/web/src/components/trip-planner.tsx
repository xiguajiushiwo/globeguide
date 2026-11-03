'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpRight, Download, Plus, Trash2, Upload } from 'lucide-react';
import { destinationCatalog, getDestination } from '@globeguide/domain';

import { copy } from '@/lib/copy';
import { getGuide } from '@/lib/guides';
import { flattenJapanRoute, getJapanRouteTemplate, japanRouteTemplates, japanTripDestinationId, japanTripStops, type JapanRouteTemplateId } from '@/lib/japan-trip';
import { deleteTrip, exportTrips, importTrips, readTrips, saveTrip, type Trip } from '@/lib/trips';

type Draft = Pick<Trip, 'title' | 'destinationId' | 'startDate' | 'endDate' | 'notes' | 'highlightIds' | 'route'>;

function blankDraft(destinationId = destinationCatalog[0]?.place.id ?? japanTripDestinationId, routeTemplateId?: JapanRouteTemplateId): Draft {
  const route = destinationId === japanTripDestinationId && routeTemplateId ? { kind: 'japan' as const, templateId: routeTemplateId } : undefined;
  return { title: '', destinationId, startDate: null, endDate: null, notes: '', highlightIds: route ? flattenJapanRoute(route.templateId) : [], ...(route ? { route } : {}) };
}

export function TripPlanner() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => blankDraft());
  const [status, setStatus] = useState('');
  const [stopToAdd, setStopToAdd] = useState('');
  const importInput = useRef<HTMLInputElement>(null);
  const guide = getGuide(draft.destinationId);
  const japanTrip = draft.destinationId === japanTripDestinationId;
  const availableStops = japanTrip
    ? japanTripStops.filter((item) => !draft.highlightIds.includes(item.id)).map((item) => ({ id: item.id, label: item.name }))
    : guide?.highlights.filter((item) => !draft.highlightIds.includes(item.id)).map((item) => ({ id: item.id, label: item.title })) ?? [];

  function stopLabel(id: string): string {
    return guide?.highlights.find((item) => item.id === id)?.title
      ?? japanTripStops.find((item) => item.id === id)?.name
      ?? copy.unavailableStop;
  }

  useEffect(() => {
    const stored = readTrips();
    setTrips(stored);
    const requested = new URLSearchParams(window.location.search).get('destination');
    if (requested && getDestination(requested)) {
      const requestedRoute = getJapanRouteTemplate(new URLSearchParams(window.location.search).get('route'))?.id;
      setDraft(blankDraft(requested, requestedRoute));
      return;
    }
    if (stored[0]) {
      setSelectedId(stored[0].id);
      setDraft(stored[0]);
    }
  }, []);

  function selectTrip(trip: Trip) {
    setSelectedId(trip.id);
    setDraft(trip);
    setStopToAdd('');
    setStatus('');
    window.history.replaceState(window.history.state, '', '/trips/');
  }

  function startNew() {
    setSelectedId(null);
    setDraft(blankDraft(draft.destinationId));
    setStopToAdd('');
    setStatus('');
  }

  function applyJapanRoute(templateId: JapanRouteTemplateId) {
    const template = getJapanRouteTemplate(templateId);
    if (!template) return;
    setDraft({ ...draft, route: { kind: 'japan', templateId }, highlightIds: flattenJapanRoute(templateId) });
    setStopToAdd('');
    setStatus(`${template.label}路线已加入，可继续调整地点。`);
  }

  function changeDestination(destinationId: string) {
    const { route: _route, ...withoutRoute } = draft;
    setDraft({ ...withoutRoute, destinationId, highlightIds: [] });
    setStopToAdd('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const saved = saveTrip({ ...draft, version: 1, id: selectedId ?? crypto.randomUUID(), updatedAt: new Date().toISOString() });
      setTrips(readTrips());
      setSelectedId(saved.id);
      setDraft(saved);
      setStatus(copy.tripSaved);
      window.history.replaceState(window.history.state, '', '/trips/');
    } catch {
      setStatus(copy.tripSaveError);
    }
  }

  function removeSelected() {
    if (!selectedId || !window.confirm(copy.confirmDeleteTrip)) return;
    try {
      deleteTrip(selectedId);
      const remaining = readTrips();
      setTrips(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setDraft(remaining[0] ?? blankDraft());
      setStatus(copy.tripDeleted);
    } catch {
      setStatus(copy.tripStorageError);
    }
  }

  function moveStop(index: number, direction: -1 | 1) {
    const next = [...draft.highlightIds];
    const current = next[index];
    const adjacent = next[index + direction];
    if (current === undefined || adjacent === undefined) return;
    [next[index], next[index + direction]] = [adjacent, current];
    setDraft({ ...draft, highlightIds: next });
  }

  function download() {
    let url: string | undefined;
    try {
      const blob = new Blob([exportTrips()], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      const downloadUrl = url;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'wayella-trips.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setStatus('');
    } catch {
      if (url) URL.revokeObjectURL(url);
      setStatus(copy.tripExportError);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('File is too large.');
      const imported = importTrips(await file.text());
      setTrips(imported);
      if (imported[0]) selectTrip(imported[0]);
      setStatus(copy.importedTrips);
    } catch {
      setStatus(copy.tripImportError);
    } finally {
      event.target.value = '';
    }
  }

  if (trips === null) return null;

  return <div className="trip-planner">
    <div className="trip-planner__toolbar">
      <button className="trip-primary-button" type="button" onClick={startNew}><Plus size={18} aria-hidden="true" />{copy.newTrip}</button>
      <div className="trip-planner__file-actions">
        <button type="button" onClick={download} disabled={trips.length === 0}><Download size={17} aria-hidden="true" />{copy.exportTrips}</button>
        <button type="button" onClick={() => importInput.current?.click()}><Upload size={17} aria-hidden="true" />{copy.importTrips}</button>
        <input ref={importInput} className="sr-only" type="file" accept=".json,application/json" aria-hidden="true" tabIndex={-1} onChange={upload} />
      </div>
    </div>
    <p className="trip-planner__status" role="status" aria-live="polite">{status}</p>
    <div className="trip-planner__layout">
      <aside className="trip-planner__list" aria-label={copy.tripsTitle}>
        {trips.length === 0 && <p className="trip-planner__empty">{copy.tripsEmpty}</p>}
        {trips.map((trip) => {
          const city = getDestination(trip.destinationId);
          return <button type="button" key={trip.id} className={`trip-planner__list-item${selectedId === trip.id ? ' trip-planner__list-item--active' : ''}`} aria-current={selectedId === trip.id ? 'true' : undefined} onClick={() => selectTrip(trip)}>
            <strong>{trip.title}</strong><span>{city?.place.name ?? trip.destinationId}</span>
            <small>{trip.startDate && trip.endDate ? `${trip.startDate} - ${trip.endDate}` : copy.tripDatesNotSet}</small>
          </button>;
        })}
      </aside>
      <form className="trip-editor" onSubmit={submit}>
        <div className="trip-editor__heading"><h2>{selectedId ? copy.editTrip : copy.newTrip}</h2>{selectedId && <button type="button" className="trip-editor__delete" title={copy.deleteTrip} aria-label={copy.deleteTrip} onClick={removeSelected}><Trash2 size={18} aria-hidden="true" /></button>}</div>
        <div className="trip-editor__fields">
          <label className="trip-field trip-field--wide">{copy.tripTitle}<input required maxLength={100} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={copy.tripTitlePlaceholder} /></label>
          <label className="trip-field trip-field--wide">{copy.tripDestination}<select value={draft.destinationId} onChange={(event) => changeDestination(event.target.value)}>{destinationCatalog.map((item) => <option key={item.place.id} value={item.place.id}>{item.place.name} · {item.nameZh}</option>)}</select></label>
          <label className="trip-field">{copy.tripStartDate}<input type="date" value={draft.startDate ?? ''} max={draft.endDate ?? undefined} onChange={(event) => setDraft({ ...draft, startDate: event.target.value || null })} /></label>
          <label className="trip-field">{copy.tripEndDate}<input type="date" value={draft.endDate ?? ''} min={draft.startDate ?? undefined} onChange={(event) => setDraft({ ...draft, endDate: event.target.value || null })} /></label>
        </div>
        {japanTrip && <section className="japan-route-picker" aria-labelledby="japan-route-picker-title">
          <div className="trip-editor__section-heading"><div><h3 id="japan-route-picker-title">日本路线模板</h3><p>先选一条主线，再按日期、体力和预约情况调整地点。</p></div>{draft.route && <span className="japan-route-picker__selected">已选 {getJapanRouteTemplate(draft.route.templateId)?.label}</span>}</div>
          <div className="japan-route-picker__options">{japanRouteTemplates.map((template) => <button key={template.id} type="button" className={draft.route?.templateId === template.id ? 'is-active' : ''} onClick={() => applyJapanRoute(template.id)}><strong>{template.label}</strong><span>{template.description}</span></button>)}</div>
          {draft.route && <div className="japan-route-picker__days">{getJapanRouteTemplate(draft.route.templateId)?.days.map((day) => <div key={day.day}><strong>D{day.day} · {day.city}</strong><span>{day.title}<small>{day.summary}</small></span></div>)}</div>}
        </section>}
        <div className="trip-editor__stops">
          <div className="trip-editor__section-heading"><h3>{copy.tripStops}</h3>{guide && <Link href={`/destinations/${guide.place.id}`} className="text-link">{copy.viewGuide}<ArrowUpRight size={16} aria-hidden="true" /></Link>}</div>
          {draft.highlightIds.length > 0 && <ol className="trip-stops">{draft.highlightIds.map((id, index) => {
            const label = stopLabel(id);
            return <li key={id}><span>{label}</span><div>
              <button type="button" title={copy.moveUp} aria-label={`${copy.moveUp}: ${label}`} disabled={index === 0} onClick={() => moveStop(index, -1)}><ArrowUp size={17} aria-hidden="true" /></button>
              <button type="button" title={copy.moveDown} aria-label={`${copy.moveDown}: ${label}`} disabled={index === draft.highlightIds.length - 1} onClick={() => moveStop(index, 1)}><ArrowDown size={17} aria-hidden="true" /></button>
              <button type="button" title={copy.removeStop} aria-label={`${copy.removeStop}: ${label}`} onClick={() => setDraft({ ...draft, highlightIds: draft.highlightIds.filter((item) => item !== id) })}><Trash2 size={17} aria-hidden="true" /></button>
            </div></li>;
          })}</ol>}
          {availableStops.length > 0 && <div className="trip-editor__add-stop"><label className="sr-only" htmlFor="trip-add-stop">{copy.addStop}</label><select id="trip-add-stop" value={stopToAdd} onChange={(event) => setStopToAdd(event.target.value)}><option value="">{copy.chooseStop}</option>{availableStops.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><button type="button" disabled={!stopToAdd} onClick={() => { setDraft({ ...draft, highlightIds: [...draft.highlightIds, stopToAdd] }); setStopToAdd(''); }}><Plus size={17} aria-hidden="true" />{copy.addStop}</button></div>}
        </div>
        <label className="trip-field trip-field--wide">{copy.tripNotes}<textarea maxLength={4000} rows={5} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder={copy.tripNotesPlaceholder} /></label>
        <div className="trip-editor__footer"><button className="trip-primary-button" type="submit">{copy.saveTrip}</button></div>
      </form>
    </div>
  </div>;
}

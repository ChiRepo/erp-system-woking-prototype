import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createChatHistoryRepository, compareMessages } from './src/services/chatHistoryRepository.js';
import { StudentChatService, studentChatService } from './src/services/studentChatService.js';
import { studentE2EE } from './src/services/studentE2EE.js';
import { studentSearchService } from './src/services/studentSearchService.js';
import { chatWorkspacePreferences } from './src/services/chatWorkspacePreferences.js';
import ChatRoom from './src/components/chat/ChatRoom.jsx';
import { ThemeProvider } from './src/contexts/ThemeContext.jsx';
import { AuthContext } from './src/contexts/authSession.js';

const settle = () => new Promise(resolve => setTimeout(resolve, 30));
const message = index => ({ id: `message-${String(index).padStart(5, '0')}`, timestamp: Math.floor(index / 5), type: 'text', text: `History fixture ${index}`, from: 'history-peer' });
const documentFor = value => ({ id: value.id, data: () => ({ ...value }) });
function sourceFixture(count) {
  let records = Array.from({ length: count }, (_, index) => message(index));
  const watchers = [], reads = [];
  let readOverride;
  const select = spec => {
    let values = [...records].sort(compareMessages);
    if (spec.from) values = values.filter(value => compareMessages(value, spec.from.data()) >= 0);
    if (spec.before) values = values.filter(value => compareMessages(value, spec.before.data()) < 0);
    return (spec.size ? values.slice(-spec.size) : values).map(documentFor);
  };
  return {
    watchers, reads,
    watch(spec, next, fail) {
      const watcher = { spec, next, fail, stopped: false };
      watchers.push(watcher);
      queueMicrotask(() => { if (!watcher.stopped) next({ docs: select(spec), fromCache: false }); });
      return () => { watcher.stopped = true; };
    },
    async read(spec) { reads.push(spec); return readOverride ? readOverride(spec, select(spec)) : select(spec); },
    overrideRead(value) { readOverride = value; },
    append(...values) { records.push(...values); this.emit(); },
    remove(id) { records = records.filter(value => value.id !== id); this.emit(); },
    emit() { for (const watcher of watchers) if (!watcher.stopped) watcher.next({ docs: select(watcher.spec), fromCache: false }); },
    count: () => records.length
  };
}

export async function runChatHistoryChecks(check, base, peer) {
  const source = sourceFixture(405);
  const repository = createChatHistoryRepository(source);
  let messages = [], status = {}, emissions = 0;
  const stop = repository.subscribe({ chatId: 'history-fixture', isChannel: true, pageSize: 50 }, (value, state) => { messages = value; status = state; ++emissions; });
  try {
    await settle();
    check('History begins with a bounded latest page and exposes older messages', messages.length === 50 && messages[0].id === message(355).id && status.hasMore);
    await stop.loadOlder(); await settle();
    check('Cursor paging retrieves an older page across equal timestamps without duplicate messages', messages.length === 100 && new Set(messages.map(item => item.id)).size === 100 && messages[0].id === message(305).id);
    source.append(...Array.from({ length: 120 }, (_, index) => message(405 + index)));
    await settle();
    check('A live burst larger than the original window retains every message in the loaded range', messages.length === 220 && messages[0].id === message(305).id && messages.at(-1).id === message(524).id);
    let releasePage;
    source.overrideRead((_spec, selected) => new Promise(resolve => { releasePage = () => resolve(selected); }));
    const paging = stop.loadOlder();
    source.append(message(525)); await settle();
    releasePage(); await paging; await settle();
    check('Messages arriving during an older-page request remain present after the range expands', messages.length === 271 && messages[0].id === message(255).id && messages.at(-1).id === message(525).id);
    source.remove(message(255).id); await settle();
    check('Authoritative live snapshots remove deleted messages without losing the pagination cursor', !messages.some(value => value.id === message(255).id) && messages.length === 270);
    source.overrideRead(async () => { throw new Error('Fixture offline'); });
    await stop.loadOlder(); await settle();
    check('Failed older-history reads keep visible history and expose a retryable error', messages.length === 270 && !!status.error && status.hasMore && !status.loadingOlder);
    source.overrideRead(null);
    await stop.loadOlder(); await settle();
    check('Retrying older history recovers and clears the loading error', messages.length === 320 && !status.error && messages[0].id === message(205).id);
    while (status.hasMore) { await stop.loadOlder(); await settle(); }
    check('Paging reaches the true beginning without truncation, duplication or lost equal-time rows', messages.length === source.count() && messages[0].id === message(0).id && new Set(messages.map(value => value.id)).size === source.count());
  } finally { stop(); }
  const countBeforeLate = emissions;
  source.watchers.at(-1).next({ docs: [], fromCache: false }); await settle();
  check('Closing a history session stops its listener and ignores late snapshots', source.watchers.every(watcher => watcher.stopped) && emissions === countBeforeLate);

  const exportSource = sourceFixture(450);
  const exportRepository = createChatHistoryRepository(exportSource);
  let firstRead = true;
  exportSource.overrideRead((_spec, selected) => {
    if (firstRead) { firstRead = false; exportSource.append(message(450)); }
    return selected;
  });
  const exported = await exportRepository.readAll({ chatId: 'export-fixture', isChannel: true });
  check('Export pages the complete saved history and excludes messages arriving after its initial boundary', exported.length === 450 && exported[0].id === message(0).id && exported.at(-1).id === message(449).id && exportSource.reads.length === 3);
  exportSource.overrideRead(async () => { throw new Error('Fixture export unavailable'); });
  let exportFailed = false;
  try { await exportRepository.readAll({ chatId: 'export-fixture', isChannel: true }); } catch { exportFailed = true; }
  const controller = new AbortController(); controller.abort();
  let exportAborted = false;
  try { await exportRepository.readAll({ chatId: 'export-fixture', isChannel: true }, { signal: controller.signal }); } catch (error) { exportAborted = error.name === 'AbortError'; }
  check('Export rejects failed reads and cancellation instead of reporting incomplete history as success', exportFailed && exportAborted);

  const key = await studentE2EE.generateConversationKey();
  const cipher = await studentE2EE.encrypt('Decrypted older history fixture', key, 'encrypted-history-fixture');
  const encryptedSource = sourceFixture(1);
  encryptedSource.append({ ...message(1), text: cipher });
  const encryptedRepository = createChatHistoryRepository(encryptedSource);
  const service = new StudentChatService({}, {}, encryptedRepository);
  let dmMessages = [];
  const stopDm = service.subscribeToMessages('encrypted-history-fixture', key, value => { dmMessages = value; }, 1);
  await settle(); await stopDm.loadOlder(); await settle();
  check('The actual direct-message service decrypts both live and paged history through its shared repository', dmMessages.length === 2 && dmMessages[1].text === 'Decrypted older history fixture');
  stopDm();

  let releaseDecode, slowCallback, slowMessages = [];
  const raceRepository = createChatHistoryRepository({
    watch(_spec, next) { slowCallback = next; return () => {}; }, read: async () => []
  }, text => text === 'E2EE::slow' ? new Promise(resolve => { releaseDecode = resolve; }) : Promise.resolve('new decoded value'));
  const stopRace = raceRepository.subscribe({ chatId: 'race-fixture' }, value => { slowMessages = value; });
  slowCallback({ docs: [documentFor({ ...message(0), text: 'E2EE::slow' })], fromCache: true });
  slowCallback({ docs: [documentFor({ ...message(1), text: 'E2EE::fast' })], fromCache: true });
  await settle(); releaseDecode('old decoded value'); await settle();
  check('A slow old decryption cannot overwrite a newer received history snapshot', slowMessages.length === 1 && slowMessages[0].text === 'new decoded value');
  stopRace();

  const cacheSource = sourceFixture(80);
  let cacheMessages = [], cacheStatus = {}, cacheEmissions = 0;
  const stopCache = createChatHistoryRepository(cacheSource).subscribe({ chatId: 'cache-fixture', isChannel: true, pageSize: 20 }, (value, state) => { cacheMessages = value; cacheStatus = state; ++cacheEmissions; });
  await settle();
  await stopCache.loadOlder(); await settle();
  cacheSource.watchers.at(-1).next({ docs: [documentFor(message(79))], fromCache: true }); await settle();
  check('An incomplete cached range cannot erase older messages already fetched from the server', cacheMessages.length === 40 && cacheMessages[0].id === message(40).id);
  let finishLatePage;
  cacheSource.overrideRead((_spec, selected) => new Promise(resolve => { finishLatePage = () => resolve(selected); }));
  const latePage = stopCache.loadOlder(); await settle();
  stopCache();
  const emissionsAtClose = cacheEmissions, watchesAtClose = cacheSource.watchers.length;
  finishLatePage(); await latePage; await settle();
  check('A pending older-page response cannot reopen or update a closed conversation', cacheEmissions === emissionsAtClose && cacheSource.watchers.length === watchesAtClose && cacheSource.watchers.every(watcher => watcher.stopped));

  let initialCacheCallback, initialMessages = [], initialStatus = {};
  const stopInitialCache = createChatHistoryRepository({
    watch(_spec, next) { initialCacheCallback = next; return () => {}; }, read: async () => []
  }).subscribe({ chatId: 'initial-cache-fixture', isChannel: true, pageSize: 2 }, (value, state) => { initialMessages = value; initialStatus = state; });
  initialCacheCallback({ docs: [documentFor(message(79))], fromCache: true }); await settle();
  initialCacheCallback({ docs: [documentFor(message(77)), documentFor(message(78)), documentFor(message(79))], fromCache: false }); await settle();
  check('An initial cached subset does not establish a false beginning before the server supplies the page', initialMessages.length === 2 && initialMessages[0].id === message(78).id && initialStatus.hasMore);
  stopInitialCache();

  const fixture = document.createElement('div');
  fixture.style.cssText = 'position:fixed;left:-12000px;top:0;width:1000px;height:600px;display:flex;visibility:hidden';
  document.body.append(fixture);
  const root = createRoot(fixture);
  const originals = { messages: studentChatService.subscribeToMessages, directory: studentSearchService.subscribeStudents, workspace: chatWorkspacePreferences.subscribe };
  let receive, rejectOlder = true, history = Array.from({ length: 70 }, (_, index) => ({ ...message(index), from: peer.uid }));
  const thread = { id: 'scroll-history-fixture', participants: [base.uid, peer.uid], participantNames: { [peer.uid]: peer.name }, participantDetails: { [peer.uid]: peer } };
  try {
    studentChatService.subscribeToMessages = (_id, _key, callback) => {
      receive = callback;
      callback(history, { hasMore: true });
      const unsubscribe = () => {};
      unsubscribe.loadOlder = async () => {
        if (rejectOlder) { callback(history, { hasMore: true, error: 'Fixture older history unavailable' }); return; }
        history = [{ ...message(-1), id: 'earliest-fixture', text: 'Prepended older history', from: peer.uid }, ...history];
        callback(history, { hasMore: false });
      };
      return unsubscribe;
    };
    studentSearchService.subscribeStudents = callback => { callback([base, peer]); return () => {}; };
    chatWorkspacePreferences.subscribe = (_uid, _id, callback) => { callback({}); return () => {}; };
    flushSync(() => root.render(<AuthContext.Provider value={{ user: base }}><ThemeProvider><ChatRoom chat={thread} currentStudent={base} onBack={() => {}} /></ThemeProvider></AuthContext.Provider>));
    await settle();
    const viewport = fixture.querySelector('[aria-label="Chat message history"]');
    check('The actual room initially opens at the newest message', viewport.scrollHeight > viewport.clientHeight && Math.abs(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop) < 2);
    viewport.scrollTop = 400; viewport.dispatchEvent(new Event('scroll', { bubbles: true }));
    await settle();
    const visibleAnchor = () => [...viewport.querySelectorAll('[data-message-id]')].find(element => element.getBoundingClientRect().bottom > viewport.getBoundingClientRect().top);
    const anchor = visibleAnchor(), anchorId = anchor.dataset.messageId;
    const offset = () => [...viewport.querySelectorAll('[data-message-id]')].find(element => element.dataset.messageId === anchorId).getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    const originalOffset = offset();
    history = [...history, { ...message(70), from: peer.uid }]; receive(history, { hasMore: true });
    await settle();
    check('An incoming message preserves the reader’s visible message and offers a new-message action', Math.abs(offset() - originalOffset) < 2 && fixture.textContent.includes('New messages ↓'));
    [...fixture.querySelectorAll('button')].find(button => button.textContent === 'Load older messages').click();
    await settle();
    check('The actual room preserves history and the reading anchor when an older-history read fails', fixture.textContent.includes('Fixture older history unavailable') && !fixture.textContent.includes('Prepended older history') && Math.abs(offset() - originalOffset) < 2);
    rejectOlder = false;
    [...fixture.querySelectorAll('button')].find(button => button.textContent === 'Load older messages').click();
    await settle();
    check('The actual older-history retry prepends messages without shifting the reading anchor or retaining the error', fixture.textContent.includes('Prepended older history') && Math.abs(offset() - originalOffset) < 2 && !fixture.textContent.includes('Load older messages') && !fixture.textContent.includes('Fixture older history unavailable'));
    [...fixture.querySelectorAll('button')].find(button => button.textContent === 'New messages ↓').click();
    await settle();
    history = [...history, { ...message(71), from: peer.uid }]; receive(history, { hasMore: false });
    await settle();
    check('Returning to new messages resumes following subsequent messages at the bottom', Math.abs(viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop) < 2 && !fixture.textContent.includes('New messages ↓'));
  } finally {
    flushSync(() => root.unmount()); fixture.remove();
    studentChatService.subscribeToMessages = originals.messages;
    studentSearchService.subscribeStudents = originals.directory;
    chatWorkspacePreferences.subscribe = originals.workspace;
  }
}

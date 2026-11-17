import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HighlightedEditor from './components/HighlightedEditor';
import WritingCheckerPanel from './components/WritingCheckerPanel';
import WordEnhancerPanel from './components/WordEnhancerPanel';
import Toast from './components/Toast';
import HistorySidebar from './components/history/HistorySidebar';
import WritingPreviewModal from './components/preview/WritingPreviewModal';
import ProfileModal from './components/profile/ProfileModal';
import AppLoader from './components/AppLoader';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { historyService } from './services/historyService';
import { SAMPLE_TEXTS } from './sampleTexts';
import { fetchHealth, checkWriting, enhanceWords } from './api';
import { Play, Sparkles, Trash2, BookOpen, Layers } from 'lucide-react';

function QuilloraMainApp() {
  const { currentUser, logout } = useAuth();

  // Sessions / History State
  const [sessions, setSessions] = useState(() => historyService.getAllSessions());
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const list = historyService.getAllSessions();
    return list.length > 0 ? list[0].id : null;
  });

  // Sidebar Layout States
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Initial Document Load from current session
  const initialSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  const [activeTab, setActiveTab] = useState(initialSession?.mode || 'checker');
  const [text, setText] = useState(initialSession?.content || SAMPLE_TEXTS.checker.text);
  const [originalSnapshot, setOriginalSnapshot] = useState(initialSession?.content || SAMPLE_TEXTS.checker.text);
  const [appliedCount, setAppliedCount] = useState(0);

  // Checker State
  const [checkerIssues, setCheckerIssues] = useState(initialSession?.checkerIssues || []);
  const [checkerStats, setCheckerStats] = useState(null);
  const [englishVariant, setEnglishVariant] = useState(initialSession?.englishVariant || 'American');

  // Enhancer State
  const [enhancerSuggestions, setEnhancerSuggestions] = useState(initialSession?.enhancerSuggestions || []);
  const [enhancerStats, setEnhancerStats] = useState(null);
  const [selectedTone, setSelectedTone] = useState(initialSession?.selectedTone || 'neutral');

  // Editor State
  const [selectedId, setSelectedId] = useState(null);
  const [editorMode, setEditorMode] = useState('edit');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [health, setHealth] = useState(null);
  const [toast, setToast] = useState(null);

  // Load Health on Mount
  const loadHealth = async () => {
    const data = await fetchHealth();
    setHealth(data);
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Debounced auto-save current document into session history
  useEffect(() => {
    if (!currentSessionId) return;
    const timer = setTimeout(() => {
      const current = sessions.find(s => s.id === currentSessionId);
      if (current && (current.content !== text || current.mode !== activeTab)) {
        const updated = historyService.saveSession({
          id: currentSessionId,
          content: text,
          mode: activeTab,
          checkerIssues,
          enhancerSuggestions,
          selectedTone,
          englishVariant,
        });
        setSessions(updated);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [text, currentSessionId, activeTab, checkerIssues, enhancerSuggestions, selectedTone, englishVariant]);

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter to analyze
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, activeTab, englishVariant, selectedTone]);

  // Session Management Handlers
  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    setText(session.content || '');
    setOriginalSnapshot(session.content || '');
    setActiveTab(session.mode || 'checker');
    setCheckerIssues(session.checkerIssues || []);
    setEnhancerSuggestions(session.enhancerSuggestions || []);
    if (session.selectedTone) setSelectedTone(session.selectedTone);
    if (session.englishVariant) setEnglishVariant(session.englishVariant);
    setSelectedId(null);
    setAppliedCount(0);
    setEditorMode('edit');
    showToast(`Loaded: ${session.title}`);
  };

  const handleNewSession = () => {
    const newSession = {
      id: `session-${Date.now()}`,
      title: 'Untitled Document',
      content: '',
      mode: 'checker',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checkerIssues: [],
      enhancerSuggestions: [],
      selectedTone: 'neutral',
      englishVariant: 'American',
    };
    const updated = historyService.saveSession(newSession);
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    setText('');
    setOriginalSnapshot('');
    setCheckerIssues([]);
    setEnhancerSuggestions([]);
    setActiveTab('checker');
    setSelectedId(null);
    setAppliedCount(0);
    setEditorMode('edit');
    showToast('New document created');
  };

  const handleRenameSession = (id, newTitle) => {
    const updated = historyService.renameSession(id, newTitle);
    setSessions(updated);
    showToast('Document renamed');
  };

  const handleDeleteSession = (id) => {
    const updated = historyService.deleteSession(id);
    setSessions(updated);
    if (currentSessionId === id) {
      if (updated.length > 0) {
        handleSelectSession(updated[0]);
      } else {
        handleNewSession();
      }
    }
    showToast('Document deleted');
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileDrawerOpen(prev => !prev);
    } else {
      setIsDesktopSidebarOpen(prev => !prev);
    }
  };

  // Run AI Analysis
  const handleAnalyze = async () => {
    if (!text.trim()) {
      showToast('Please enter some English text to analyze', 'error');
      return;
    }

    try {
      setIsAnalyzing(true);
      setSelectedId(null);

      if (activeTab === 'checker') {
        const res = await checkWriting(text, englishVariant);
        setCheckerIssues(res.issues);
        setCheckerStats(res.stats);
        setOriginalSnapshot(text);
        setAppliedCount(0);
        setEditorMode(res.issues.length > 0 ? 'review' : 'edit');
        if (res.issues.length === 0) {
          showToast('No errors found! Writing is clean and accurate.');
        } else {
          showToast(`Found ${res.issues.length} writing issue${res.issues.length > 1 ? 's' : ''}`);
        }
      } else {
        const res = await enhanceWords(text, selectedTone);
        setEnhancerSuggestions(res.suggestions);
        setEnhancerStats(res.stats);
        setOriginalSnapshot(text);
        setAppliedCount(0);
        setEditorMode(res.suggestions.length > 0 ? 'review' : 'edit');
        if (res.suggestions.length === 0) {
          showToast('Vocabulary is already strong! No weak words detected.');
        } else {
          showToast(`Found ${res.suggestions.length} enhancement opportunity${res.suggestions.length > 1 ? 's' : ''}`);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Individual apply for Writing Checker
  const handleApplyCheckerIssue = (idx) => {
    const issue = checkerIssues[idx];
    if (!issue) return;

    const before = text.slice(0, issue.start);
    const after = text.slice(issue.end);
    const newText = before + issue.suggestion + after;
    const delta = issue.suggestion.length - (issue.end - issue.start);

    // Shift offsets of remaining issues
    const updatedIssues = checkerIssues
      .filter((_, i) => i !== idx)
      .map((item) => {
        if (item.start >= issue.end) {
          return {
            ...item,
            start: item.start + delta,
            end: item.end + delta,
          };
        }
        return item;
      });

    setText(newText);
    setCheckerIssues(updatedIssues);
    setAppliedCount((prev) => prev + 1);
    setSelectedId(null);
    showToast(`Applied correction: "${issue.suggestion}"`);
  };

  const handleIgnoreCheckerIssue = (idx) => {
    setCheckerIssues(checkerIssues.filter((_, i) => i !== idx));
    setSelectedId(null);
  };

  // Apply all safe corrections right-to-left
  const handleApplyAllCheckerIssues = () => {
    if (!checkerIssues.length) return;

    // Sort descending by start offset
    const sorted = [...checkerIssues].sort((a, b) => b.start - a.start);
    let updatedText = text;

    for (const item of sorted) {
      const before = updatedText.slice(0, item.start);
      const after = updatedText.slice(item.end);
      updatedText = before + item.suggestion + after;
    }

    const count = checkerIssues.length;
    setText(updatedText);
    setCheckerIssues([]);
    setAppliedCount((prev) => prev + count);
    setSelectedId(null);
    showToast(`Applied all ${count} corrections!`);
  };

  // Safe apply selected from Preview Modal (Right-to-Left)
  const handleApplyFromPreview = ({ selectedIndices, chosenAlternatives }) => {
    const currentItems = activeTab === 'checker' ? checkerIssues : enhancerSuggestions;
    if (!currentItems || currentItems.length === 0) return;

    // Filter selected items and sort descending by start (Right-to-Left)
    const applied = currentItems
      .map((item, idx) => ({ ...item, idx }))
      .filter((item) => selectedIndices.has(item.idx))
      .sort((a, b) => b.start - a.start);

    if (applied.length === 0) {
      showToast('No changes selected to apply', 'info');
      return;
    }

    let updatedText = text;
    let remaining = currentItems
      .map((item, idx) => ({ ...item, idx }))
      .filter((item) => !selectedIndices.has(item.idx));

    for (const app of applied) {
      const replacement =
        activeTab === 'checker'
          ? app.suggestion
          : (chosenAlternatives[app.idx] || (app.alternatives && app.alternatives[0]) || app.suggestion || '');

      const before = updatedText.slice(0, app.start);
      const after = updatedText.slice(app.end);
      updatedText = before + replacement + after;
      const delta = replacement.length - (app.end - app.start);

      // Shift offsets of remaining unapplied items
      remaining = remaining.map((rem) => {
        if (rem.start >= app.end) {
          return {
            ...rem,
            start: rem.start + delta,
            end: rem.end + delta,
          };
        }
        return rem;
      });
    }

    setText(updatedText);
    if (activeTab === 'checker') {
      setCheckerIssues(remaining);
    } else {
      setEnhancerSuggestions(remaining);
    }
    setAppliedCount((prev) => prev + applied.length);
    setSelectedId(null);
    setIsPreviewOpen(false);
    showToast(`Successfully applied ${applied.length} change${applied.length > 1 ? 's' : ''}!`);
  };

  // Individual apply for Word Enhancer
  const handleApplyEnhancerAlternative = (idx, chosenAlt) => {
    const item = enhancerSuggestions[idx];
    if (!item) return;

    const before = text.slice(0, item.start);
    const after = text.slice(item.end);
    const newText = before + chosenAlt + after;
    const delta = chosenAlt.length - (item.end - item.start);

    // Shift offsets of remaining suggestions
    const updatedSuggestions = enhancerSuggestions
      .filter((_, i) => i !== idx)
      .map((sugg) => {
        if (sugg.start >= item.end) {
          return {
            ...sugg,
            start: sugg.start + delta,
            end: sugg.end + delta,
          };
        }
        return sugg;
      });

    setText(newText);
    setEnhancerSuggestions(updatedSuggestions);
    setAppliedCount((prev) => prev + 1);
    setSelectedId(null);
    showToast(`Enhanced with "${chosenAlt}"`);
  };

  const handleIgnoreEnhancerSuggestion = (idx) => {
    setEnhancerSuggestions(enhancerSuggestions.filter((_, i) => i !== idx));
    setSelectedId(null);
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Document copied to clipboard!');
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  // Reset to snapshot
  const handleResetToSnapshot = () => {
    setText(originalSnapshot);
    setAppliedCount(0);
    setSelectedId(null);
    showToast('Reset to original text');
  };

  // Clear text
  const handleClearText = () => {
    setText('');
    setCheckerIssues([]);
    setEnhancerSuggestions([]);
    setSelectedId(null);
    setAppliedCount(0);
    setEditorMode('edit');
  };

  // Load sample text
  const handleLoadSample = (sampleKey) => {
    const sample = SAMPLE_TEXTS[sampleKey];
    if (sample) {
      setText(sample.text);
      setOriginalSnapshot(sample.text);
      setCheckerIssues([]);
      setEnhancerSuggestions([]);
      setSelectedId(null);
      setAppliedCount(0);
      setEditorMode('edit');
      showToast(`Loaded: ${sample.title}`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Desktop Collapsible Sidebar */}
      <HistorySidebar
        sessions={sessions}
        activeSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isDesktopSidebarOpen}
        onToggleOpen={() => setIsDesktopSidebarOpen(prev => !prev)}
        isMobile={false}
      />

      {/* Mobile Drawer Sidebar */}
      <HistorySidebar
        sessions={sessions}
        activeSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        isMobile={true}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Navigation Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedId(null);
          }}
          health={health}
          onReloadHealth={loadHealth}
          onToggleSidebar={handleToggleSidebar}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Main Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
          {/* Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            {/* Sample Loaders */}
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1" /> Samples:
              </span>
              <button
                onClick={() => handleLoadSample('checker')}
                className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Grammar Mistakes
              </button>
              <button
                onClick={() => handleLoadSample('enhancer')}
                className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Weak Vocabulary
              </button>
              <button
                onClick={() => handleLoadSample('dialogue')}
                className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Dialogue & Fiction
              </button>
              <button
                onClick={() => handleLoadSample('longStory')}
                className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-2xs hidden sm:inline-block"
              >
                Multi-Paragraph
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {text && (
                <button
                  onClick={handleClearText}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                  title="Clear current text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}

              {/* Analyze CTA */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !text.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : activeTab === 'checker' ? (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Check Writing</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Enhance Words</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2-Column Split Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
            {/* Left Column: Editor & Highlighting */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <HighlightedEditor
                text={text}
                onChangeText={setText}
                items={activeTab === 'checker' ? checkerIssues : enhancerSuggestions}
                selectedId={selectedId}
                onSelectItem={(id) => setSelectedId(id)}
                isAnalyzing={isAnalyzing}
                mode={editorMode}
                setMode={setEditorMode}
                type={activeTab}
              />
            </div>

            {/* Right Column: Interactive Results & Feedback */}
            <div className="lg:col-span-5 flex flex-col h-full">
              {activeTab === 'checker' ? (
                <WritingCheckerPanel
                  issues={checkerIssues}
                  selectedId={selectedId}
                  onSelectIssue={(id) => setSelectedId(id)}
                  onApplyIssue={handleApplyCheckerIssue}
                  onIgnoreIssue={handleIgnoreCheckerIssue}
                  onApplyAll={handleApplyAllCheckerIssues}
                  onOpenPreview={() => setIsPreviewOpen(true)}
                  onCopyText={handleCopyText}
                  onReset={handleResetToSnapshot}
                  hasAppliedFixes={appliedCount > 0}
                  stats={checkerStats}
                />
              ) : (
                <WordEnhancerPanel
                  suggestions={enhancerSuggestions}
                  selectedTone={selectedTone}
                  onChangeTone={(tone) => {
                    setSelectedTone(tone);
                    if (enhancerSuggestions.length > 0) {
                      setTimeout(handleAnalyze, 50);
                    }
                  }}
                  selectedId={selectedId}
                  onSelectSuggestion={(id) => setSelectedId(id)}
                  onApplyAlternative={handleApplyEnhancerAlternative}
                  onIgnoreSuggestion={handleIgnoreEnhancerSuggestion}
                  onOpenPreview={() => setIsPreviewOpen(true)}
                  onCopyText={handleCopyText}
                  onReset={handleResetToSnapshot}
                  hasAppliedFixes={appliedCount > 0}
                  stats={enhancerStats}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Side-by-Side Correction Preview Modal */}
      <WritingPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        originalText={text}
        items={activeTab === 'checker' ? checkerIssues : enhancerSuggestions}
        type={activeTab}
        onApplySelected={handleApplyFromPreview}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Floating Feedback Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function AuthBoundary() {
  const { currentUser, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [isInitializingWorkspace, setIsInitializingWorkspace] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Show smooth branded loading screen for 600ms on workspace entrance
      setIsInitializingWorkspace(true);
      const timer = setTimeout(() => {
        setIsInitializingWorkspace(false);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [currentUser?.username]);

  if (loading || isInitializingWorkspace) {
    return <AppLoader message={loading ? 'Checking authorization...' : 'Preparing your writing workspace...'} />;
  }

  if (!currentUser) {
    if (showRegister) {
      return <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
  }

  return <QuilloraMainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthBoundary />
    </AuthProvider>
  );
}

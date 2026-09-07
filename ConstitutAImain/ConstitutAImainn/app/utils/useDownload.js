import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Formats a single article into readable plain text.
 */
export function formatArticle(article, chapterTitle = '') {
  const lines = [];
  lines.push('CONSTITUTION OF THE REPUBLIC OF GHANA, 1992');
  lines.push('');
  if (chapterTitle) {
    lines.push(`Chapter: ${chapterTitle}`);
  }
  lines.push(`Article ${article.number}: ${article.title}`);
  lines.push('─'.repeat(60));
  lines.push('');
  lines.push(article.text);
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('Source: ConstitutAI — Ghana Constitution App');
  return lines.join('\n');
}

/**
 * Formats a full chapter (all articles) into readable plain text.
 */
export function formatChapter(chapter) {
  const lines = [];
  lines.push('CONSTITUTION OF THE REPUBLIC OF GHANA, 1992');
  lines.push('');
  lines.push(`CHAPTER ${chapter.number}: ${chapter.title.toUpperCase()}`);
  lines.push('═'.repeat(60));
  lines.push('');

  chapter.articles.forEach((article) => {
    lines.push(`Article ${article.number}: ${article.title}`);
    lines.push('─'.repeat(40));
    lines.push(article.text);
    lines.push('');
  });

  lines.push('═'.repeat(60));
  lines.push(`Total Articles in Chapter: ${chapter.articles.length}`);
  lines.push('Source: ConstitutAI — Ghana Constitution App');
  return lines.join('\n');
}

/**
 * Hook that provides a download/share function and loading state.
 *
 * Usage:
 *   const { downloading, downloadArticle, downloadChapter } = useDownload();
 */
export function useDownload() {
  const [downloading, setDownloading] = useState(false);

  async function _share(content, filename) {
    setDownloading(true);
    try {
      if (Platform.OS === 'web') {
        // Web: trigger a browser file download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // Native: write to a temp file then open the share sheet
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert('Not supported', 'Sharing is not available on this device.');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: `Save ${filename}`,
        UTI: 'public.plain-text',
      });
    } catch (err) {
      Alert.alert('Download failed', err.message || 'Something went wrong.');
    } finally {
      setDownloading(false);
    }
  }

  async function downloadArticle(article, chapterTitle = '') {
    const content = formatArticle(article, chapterTitle);
    const safeName = article.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const filename = `Article_${article.number}_${safeName}.txt`;
    await _share(content, filename);
  }

  async function downloadChapter(chapter) {
    const content = formatChapter(chapter);
    const safeName = chapter.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const filename = `Chapter_${chapter.number}_${safeName}.txt`;
    await _share(content, filename);
  }

  return { downloading, downloadArticle, downloadChapter };
}

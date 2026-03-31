import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface SearchMatch {
  node: Text
  offset: number
  length: number
}

export function useSearchHighlight(contentRef: Ref<HTMLElement | null>, activeTab: Ref<string>) {
  // 查找替换相关状态
  const searchReplaceShow = ref(false)
  const searchText = ref('')
  const searchMatches = ref<SearchMatch[]>([])
  const currentMatchIndex = ref(0)
  let lastSearchText = '' // 记录上一次搜索的文本
  let highlightRegistry: Highlight | null = null
  let currentHighlightRegistry: Highlight | null = null

  // 在纪要内容中查找匹配项
  function findTextInContent(targetText: string): SearchMatch[] {
    const matches: SearchMatch[] = []

    if (!targetText || !contentRef.value) {
      return matches
    }

    // 使用 TreeWalker 遍历 DOM 树中的文本节点
    const treeWalker = document.createTreeWalker(contentRef.value, NodeFilter.SHOW_TEXT, null)

    let node: Node | null = null
    while ((node = treeWalker.nextNode())) {
      const textNode = node as Text
      const textContent = textNode.textContent || ''

      // 查找所有匹配项
      let startIndex = 0
      let index = textContent.indexOf(targetText, startIndex)

      while (index !== -1) {
        matches.push({
          node: textNode,
          offset: index,
          length: targetText.length,
        })
        startIndex = index + 1
        index = textContent.indexOf(targetText, startIndex)
      }
    }

    return matches
  }

  // 使用 CSS Custom Highlight API 实现高亮
  function applyHighlights() {
    if (!searchMatches.value.length) {
      removeHighlights()
      return
    }

    // 移除旧的高亮
    removeHighlights()

    // 创建所有匹配项的高亮
    const ranges = searchMatches.value.map((match) => {
      const range = new Range()
      range.setStart(match.node, match.offset)
      range.setEnd(match.node, match.offset + match.length)
      return range
    })

    // 创建当前匹配项的高亮
    const currentMatch = searchMatches.value[currentMatchIndex.value]
    const currentRange = new Range()
    currentRange.setStart(currentMatch.node, currentMatch.offset)
    currentRange.setEnd(currentMatch.node, currentMatch.offset + currentMatch.length)

    // 注册高亮
    try {
      // 使用 CSS Custom Highlight API
      if ('Highlight' in window && 'highlights' in CSS) {
        // console.log('Using CSS Custom Highlight API')
        const registry = CSS.highlights as Map<string, Highlight>

        // 所有匹配项 - 黄色高亮
        highlightRegistry = new Highlight(...ranges)
        registry.set('search-all', highlightRegistry)

        // 当前匹配项 - 橙色高亮
        currentHighlightRegistry = new Highlight(currentRange)
        registry.set('search-current', currentHighlightRegistry)

        // console.log('Highlights applied successfully')

        // 滚动到当前匹配项
        currentMatch.node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        // 降级方案：使用 Selection API
        console.warn('CSS Custom Highlight API not supported, using Selection API fallback')
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(currentRange)
          currentMatch.node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    } catch (error) {
      console.error('Failed to apply highlights:', error)
      // 降级方案
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        const currentMatch = searchMatches.value[currentMatchIndex.value]
        const range = new Range()
        range.setStart(currentMatch.node, currentMatch.offset)
        range.setEnd(currentMatch.node, currentMatch.offset + currentMatch.length)
        selection.addRange(range)
        currentMatch.node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  // 移除高亮
  function removeHighlights() {
    try {
      if ('Highlight' in window && 'highlights' in CSS) {
        const registry = CSS.highlights as Map<string, Highlight>
        if (highlightRegistry) {
          registry.delete('search-all')
          highlightRegistry = null
        }
        if (currentHighlightRegistry) {
          registry.delete('search-current')
          currentHighlightRegistry = null
        }
      } else {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
        }
      }
    } catch (error) {
      console.error('Failed to remove highlights:', error)
    }
  }

  // 导航到上一个或下一个匹配项
  function handleNavigate(direction: 'prev' | 'next') {
    if (searchMatches.value.length === 0) return

    if (direction === 'prev') {
      currentMatchIndex.value =
        (currentMatchIndex.value - 1 + searchMatches.value.length) % searchMatches.value.length
    } else {
      currentMatchIndex.value = (currentMatchIndex.value + 1) % searchMatches.value.length
    }

    applyHighlights()
  }

  // 执行搜索
  function toSearch(text: string, isEnterKey: boolean = false) {
    searchText.value = text

    if (!text.trim()) {
      searchMatches.value = []
      currentMatchIndex.value = 0
      lastSearchText = ''
      removeHighlights()
      return
    }

    // 如果是按回车键且搜索文本与上一次相同，导航到下一个匹配项
    if (isEnterKey && text.trim() === lastSearchText && searchMatches.value.length > 0) {
      currentMatchIndex.value = (currentMatchIndex.value + 1) % searchMatches.value.length
      console.log(`导航到第 ${currentMatchIndex.value + 1} 个匹配项`)
      applyHighlights()
      return
    }

    // 重新搜索
    lastSearchText = text.trim()
    const matches = findTextInContent(text)
    searchMatches.value = matches
    currentMatchIndex.value = 0

    console.log(`找到 ${matches.length} 个匹配项`, matches)

    // 应用高亮
    if (matches.length > 0 && activeTab.value === 'summary') {
      applyHighlights()
    }
  }

  // 关闭查找替换弹窗
  function handleSearchReplaceClose() {
    searchReplaceShow.value = false
    searchText.value = ''
    searchMatches.value = []
    currentMatchIndex.value = 0
    lastSearchText = ''
    removeHighlights()
  }

  // 替换当前匹配项
  function handleReplace(oldText: string, newText: string) {
    if (!searchMatches.value.length || currentMatchIndex.value >= searchMatches.value.length) {
      return
    }

    const match = searchMatches.value[currentMatchIndex.value]
    const textNode = match.node
    const textContent = textNode.textContent || ''

    // 替换文本
    const beforeText = textContent.substring(0, match.offset)
    const afterText = textContent.substring(match.offset + match.length)
    const newContent = beforeText + newText + afterText

    // 更新文本节点
    textNode.textContent = newContent

    console.log(`已替换: "${oldText}" -> "${newText}"`)

    // 重新查找匹配项
    const newMatches = findTextInContent(searchText.value)
    searchMatches.value = newMatches

    // 如果还有匹配项，调整当前索引
    if (newMatches.length > 0) {
      // 确保索引不会越界
      if (currentMatchIndex.value >= newMatches.length) {
        currentMatchIndex.value = newMatches.length - 1
      }
      applyHighlights()
    } else {
      // 没有匹配项了，清除高亮
      removeHighlights()
    }
  }

  // 替换所有匹配项
  function handleReplaceAll(oldText: string, newText: string) {
    if (!searchMatches.value.length) {
      return
    }

    // 从后往前替换，避免偏移量问题
    const matches = [...searchMatches.value].reverse()

    matches.forEach((match) => {
      const textNode = match.node
      const textContent = textNode.textContent || ''

      // 替换文本
      const beforeText = textContent.substring(0, match.offset)
      const afterText = textContent.substring(match.offset + match.length)
      const newContent = beforeText + newText + afterText

      // 更新文本节点
      textNode.textContent = newContent
    })

    console.log(`已全部替换: "${oldText}" -> "${newText}" (共 ${matches.length} 处)`)

    // 清除匹配项和高亮
    searchMatches.value = []
    currentMatchIndex.value = 0
    removeHighlights()
  }

  // 在组件挂载时添加高亮样式
  onMounted(() => {
    // 检查 CSS Custom Highlight API 是否可用
    const apiAvailable = 'Highlight' in window && 'highlights' in CSS
    // console.log('CSS Custom Highlight API available:', apiAvailable)

    if (!apiAvailable) {
      console.warn(
        'CSS Custom Highlight API is not supported in this browser. Falling back to Selection API.',
      )
    }

    // 添加高亮样式
    const style = document.createElement('style')
    style.textContent = `
      ::highlight(search-all) {
        background-color: #ffeb3b;
        color: #000;
      }
      ::highlight(search-current) {
        background-color: #ff9800;
        color: #fff;
      }
    `
    document.head.appendChild(style)
  })

  // 在组件卸载时移除高亮
  onUnmounted(() => {
    removeHighlights()
  })

  return {
    // 状态
    searchReplaceShow,
    searchText,
    searchMatches,
    currentMatchIndex,
    // 方法
    handleNavigate,
    toSearch,
    handleSearchReplaceClose,
    handleReplace,
    handleReplaceAll,
  }
}

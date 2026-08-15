import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_STORAGE_KEY = '@voice_tasks_list_v2';
const HISTORY_STORAGE_KEY = '@voice_history_list_v2';

/**
 * Retrieves all stored tasks from AsyncStorage.
 * @returns {Promise<Array<{id: string, task: string, date: string, time: string, completed: boolean, createdAt: string}>>}
 */
export const getStoredTasks = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    if (!jsonValue) return [];
    const parsed = JSON.parse(jsonValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to retrieve tasks from storage:', error);
    return [];
  }
};

/**
 * Saves a new task into AsyncStorage, prepending it to the list.
 * @param {{task: string, date: string, time: string, notificationId?: string}} taskData 
 * @returns {Promise<Array>} Updated task list
 */
export const saveNewTask = async (taskData) => {
  try {
    const currentTasks = await getStoredTasks();
    const newTask = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      task: taskData.task || 'New Task',
      date: taskData.date || 'Today',
      time: taskData.time || 'Anytime',
      completed: false,
      notificationId: taskData.notificationId || null,
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...(Array.isArray(currentTasks) ? currentTasks : [])];
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    return updatedTasks;
  } catch (error) {
    console.error('Failed to save new task to storage:', error);
    throw error;
  }
};

/**
 * Toggles a task's completed state
 * @param {string} taskId 
 * @returns {Promise<Array>} Updated task list
 */
export const toggleTaskCompleted = async (taskId) => {
  try {
    const currentTasks = await getStoredTasks();
    const updatedTasks = (Array.isArray(currentTasks) ? currentTasks : []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    return updatedTasks;
  } catch (error) {
    console.error('Failed to toggle task completed:', error);
    throw error;
  }
};

/**
 * Deletes a task by ID from AsyncStorage.
 * @param {string} taskId 
 * @returns {Promise<Array>} Updated task list
 */
export const deleteStoredTask = async (taskId) => {
  try {
    const currentTasks = await getStoredTasks();
    const updatedTasks = (Array.isArray(currentTasks) ? currentTasks : []).filter((task) => task.id !== taskId);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    return updatedTasks;
  } catch (error) {
    console.error('Failed to delete task from storage:', error);
    throw error;
  }
};

/**
 * Clears all stored tasks from AsyncStorage.
 * @returns {Promise<void>}
 */
export const clearAllTasks = async () => {
  try {
    await AsyncStorage.removeItem(TASKS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear stored tasks:', error);
    throw error;
  }
};

/**
 * Retrieves voice conversation history
 * @returns {Promise<Array<{id: string, query: string, responseText: string, spokenResponse: string, type: string, timestamp: string}>>}
 */
export const getVoiceHistory = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!jsonValue) return [];
    const parsed = JSON.parse(jsonValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to retrieve voice history:', error);
    return [];
  }
};

/**
 * Saves a voice query and response to history
 * @param {{query: string, responseText: string, spokenResponse: string, type: string, action?: string}} historyItem 
 * @returns {Promise<Array>} Updated history list
 */
export const saveVoiceHistoryItem = async (historyItem) => {
  try {
    const currentHistory = await getVoiceHistory();
    const newItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      query: historyItem.query || '',
      responseText: historyItem.responseText || '',
      spokenResponse: historyItem.spokenResponse || historyItem.responseText || '',
      type: historyItem.type || 'CONVERSATION',
      action: historyItem.action || '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Keep the latest 50 interactions
    const updatedHistory = [newItem, ...currentHistory].slice(0, 50);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (error) {
    console.error('Failed to save voice history item:', error);
    return [];
  }
};

/**
 * Clears voice conversation history
 */
export const clearVoiceHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear voice history:', error);
  }
};

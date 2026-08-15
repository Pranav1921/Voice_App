import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * TaskCard Component
 * Futuristic Dark Glassmorphic Task Card with neon glow accents, completion checkboxes, and voice readout.
 */
export const TaskCard = ({ task, onToggleComplete, onDelete, onSpeak }) => {
  const isCompleted = !!task.completed;

  return (
    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
      {/* Left Neon Priority Indicator Bar */}
      <View style={[styles.priorityBar, isCompleted ? styles.priorityDone : styles.priorityActive]} />

      <View style={styles.contentWrapper}>
        <View style={styles.cardHeader}>
          {/* Circular Neon Checkbox */}
          <TouchableOpacity
            style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
            onPress={() => onToggleComplete && onToggleComplete(task.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          {/* Task Title */}
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={() => onToggleComplete && onToggleComplete(task.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
              numberOfLines={2}
            >
              {task.task}
            </Text>
          </TouchableOpacity>

          {/* Action Buttons: Speak & Delete */}
          <View style={styles.headerActions}>
            {onSpeak && (
              <TouchableOpacity
                style={styles.speakButton}
                onPress={() => onSpeak(task)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Read task aloud"
              >
                <Text style={styles.speakIcon}>🔊</Text>
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDelete(task.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Delete reminder"
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Badges: Date, Time, Status */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.dateBadge]}>
            <Text style={styles.dateBadgeText}>📅 {task.date || 'Today'}</Text>
          </View>

          <View style={[styles.badge, styles.timeBadge]}>
            <Text style={styles.timeBadgeText}>⏰ {task.time || 'Anytime'}</Text>
          </View>

          {isCompleted ? (
            <View style={[styles.badge, styles.completedBadge]}>
              <Text style={styles.completedBadgeText}>✅ Completed</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.reminderBadge]}>
              <Text style={styles.reminderBadgeText}>🔔 Active Alert</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardCompleted: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
    opacity: 0.75,
  },
  priorityBar: {
    width: 5,
    height: '100%',
  },
  priorityActive: {
    backgroundColor: '#38BDF8',
  },
  priorityDone: {
    backgroundColor: '#64748B',
  },
  contentWrapper: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#090D16',
    fontSize: 12,
    fontWeight: '900',
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 20,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakIcon: {
    fontSize: 12,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 12,
    color: '#F87171',
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93C5FD',
  },
  timeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FCD34D',
  },
  reminderBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  reminderBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6EE7B7',
  },
  completedBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

export default TaskCard;

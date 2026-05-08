import React from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/basic';
import { useGamification } from '../contexts/GamificationContext';
import { TrendingUp } from 'lucide-react';

export const ProgressGraphs = () => {
  const { getSessions } = useGamification();
  const sessions = getSessions();

  if (sessions.length === 0) {
    return (
      <Card className="p-6 text-center space-y-3 bg-slate-50">
        <TrendingUp size={32} className="mx-auto text-slate-300" />
        <p className="font-semibold text-slate-900">No Data Yet</p>
        <p className="text-sm text-slate-600">Complete exercises to start tracking your progress.</p>
      </Card>
    );
  }

  // Prepare data for graphs
  const accuracyData = sessions
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-30) // Last 30 sessions
    .map((session, index) => ({
      index: index + 1,
      accuracy: session.accuracy,
      exercise: session.exerciseTitle.split(' ')[0],
      date: new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

  const levelProgressionData = sessions
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-40)
    .map((session, index) => ({
      index: index + 1,
      level: session.level,
      exercise: session.exerciseTitle.split(' ')[0],
      date: new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

  // Daily average accuracy
  const dailyAverageData = Object.entries(
    sessions.reduce((acc, session) => {
      const date = session.date;
      if (!acc[date]) {
        acc[date] = { accuracies: [], sessions: 0 };
      }
      acc[date].accuracies.push(session.accuracy);
      acc[date].sessions += 1;
      return acc;
    }, {} as Record<string, { accuracies: number[]; sessions: number }>)
  )
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .slice(-14) // Last 14 days
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avgAccuracy: Math.round(data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length),
      sessionCount: data.sessions
    }));

  // Exercise comparison
  const exerciseData = [
    {
      name: 'Vowel',
      sessions: sessions.filter(s => s.exerciseId === 1).length,
      avgAccuracy: sessions
        .filter(s => s.exerciseId === 1)
        .length > 0
        ? Math.round(
            sessions.filter(s => s.exerciseId === 1).reduce((sum, s) => sum + s.accuracy, 0) /
            sessions.filter(s => s.exerciseId === 1).length
          )
        : 0,
      color: '#3b82f6'
    },
    {
      name: 'Consonant',
      sessions: sessions.filter(s => s.exerciseId === 2).length,
      avgAccuracy: sessions
        .filter(s => s.exerciseId === 2)
        .length > 0
        ? Math.round(
            sessions.filter(s => s.exerciseId === 2).reduce((sum, s) => sum + s.accuracy, 0) /
            sessions.filter(s => s.exerciseId === 2).length
          )
        : 0,
      color: '#f59e0b'
    },
    {
      name: 'Frequency',
      sessions: sessions.filter(s => s.exerciseId === 3).length,
      avgAccuracy: sessions
        .filter(s => s.exerciseId === 3)
        .length > 0
        ? Math.round(
            sessions.filter(s => s.exerciseId === 3).reduce((sum, s) => sum + s.accuracy, 0) /
            sessions.filter(s => s.exerciseId === 3).length
          )
        : 0,
      color: '#a855f7'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Daily Average Accuracy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Daily Average Accuracy
          </h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width={300} height={200} minWidth={300}>
              <BarChart data={dailyAverageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => `${value}%`}
                />
                <Bar dataKey="avgAccuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-600">
            {dailyAverageData.length > 0
              ? `Last ${dailyAverageData.length} days • ${dailyAverageData[dailyAverageData.length - 1]?.avgAccuracy}% today`
              : 'No data yet'}
          </p>
        </Card>
      </motion.div>

      {/* Accuracy Trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-lg">Accuracy Trend (Last 30)</h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width={300} height={200} minWidth={300}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => `${value}%`}
                  labelFormatter={(label) => `Session ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#8b5cf6"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-600">
            Trend: {accuracyData.length > 0 ? `${accuracyData[accuracyData.length - 1]?.accuracy}% on latest session` : 'No data'}
          </p>
        </Card>
      </motion.div>

      {/* Level Progression */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold text-lg">Difficulty Progression</h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width={300} height={200} minWidth={300}>
              <LineChart data={levelProgressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(label) => `Session ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke="#f59e0b"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-600">
            Current: Level {sessions[sessions.length - 1]?.level} across exercises
          </p>
        </Card>
      </motion.div>

      {/* Exercise Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-lg">Exercise Comparison</h3>
          <div className="space-y-3">
            {exerciseData.map((exercise) => (
              <div key={exercise.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-900">{exercise.name} Discrimination</span>
                  <div className="text-right text-xs text-slate-600">
                    <p className="font-semibold text-slate-900">{exercise.avgAccuracy}%</p>
                    <p>{exercise.sessions} sessions</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${exercise.avgAccuracy}%`,
                      backgroundColor: exercise.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Statistics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-5 bg-gradient-to-br from-slate-50 to-slate-100">
          <h3 className="font-semibold text-lg mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-slate-900">{sessions.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Overall Accuracy</p>
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Total Training Time</p>
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60)}m
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Avg Duration/Session</p>
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length)}s
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

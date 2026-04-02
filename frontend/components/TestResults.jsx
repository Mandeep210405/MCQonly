'use client';

import { useState, useEffect } from 'react';

export default function TestResults({ results, test, onClose }) {
  // Parse detailedResults if it's a string
  const parseDetailedResults = (detailedResults) => {
    if (!detailedResults) return [];
    if (Array.isArray(detailedResults)) return detailedResults;
    if (typeof detailedResults === 'string') {
      try {
        const parsed = JSON.parse(detailedResults);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse detailed results:', e);
        return [];
      }
    }
    return [];
  };

  const detailedResults = parseDetailedResults(results.detailed_results);
  const totalPoints = results.total_points || 0;
  const obtainedPoints = results.obtained_points || 0;
  const percentage = results.percentage || 0;
  const grade = results.grade || 'F';
  const aiFeedback = results.ai_feedback || results.overall_feedback || '';

  // Helper to clean MCQ options for display
  const formatAnswer = (answer, questionType, options) => {
    if (!answer) return '[No answer provided]';
    
    if (questionType === 'mcq' && (answer === 'a' || answer === 'b' || answer === 'c' || answer === 'd')) {
      // Try to get the full option text
      if (options && typeof options === 'object') {
        const optionText = options[answer];
        if (optionText) {
          return `Option ${answer.toUpperCase()}: ${optionText}`;
        }
      }
      return `Option ${answer.toUpperCase()}`;
    }
    
    return answer;
  };

  // Helper to clean option text
  const cleanOptionText = (text) => {
    if (!text) return '';
    if (typeof text === 'string') {
      return text.replace(/^["']|["']$/g, '').trim();
    }
    return text;
  };

  // Helper to parse options if needed
  const parseOptions = (options) => {
    if (!options) return {};
    if (typeof options === 'string') {
      try {
        return JSON.parse(options);
      } catch (e) {
        return {};
      }
    }
    return options;
  };

  return (
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700' }}>Test Results</h2>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: 'var(--text-muted)', 
            fontSize: '20px',
            padding: '4px 8px',
            borderRadius: '8px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ✕
        </button>
      </div>

      {/* Test Info */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          {test?.test_type?.toUpperCase()} Test
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Completed on: {results.evaluated_at ? new Date(results.evaluated_at).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : new Date().toLocaleString()}
        </p>
      </div>

      {/* Score Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(26,58,255,0.08)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Score</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '700', color: 'var(--accent)' }}>
            {percentage.toFixed(1)}%
          </p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Points</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>
            {obtainedPoints}/{totalPoints}
          </p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Grade</p>
          <p style={{ 
            fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '700',
            color: grade === 'A' ? '#22c55e' : 
                   grade === 'B' ? '#3b82f6' :
                   grade === 'C' ? '#f59e0b' : '#ef4444'
          }}>
            {grade}
          </p>
        </div>
      </div>

      {/* AI Feedback */}
      {aiFeedback && (
        <div style={{ marginBottom: '32px', padding: '20px', background: 'var(--bg-input)', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--accent)' }}>AI Feedback</h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{aiFeedback}</p>
        </div>
      )}

      {/* Detailed Results */}
      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
        Question-wise Breakdown ({detailedResults.length} questions)
      </h3>
      
      {detailedResults.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No detailed results available.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {detailedResults.map((item, idx) => {
            const questionType = item.question_type || (item.question_text?.includes('?') ? 'descriptive' : 'mcq');
            const options = item.options ? parseOptions(item.options) : null;
            
            return (
              <div key={idx} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Question {item.question_number || idx + 1}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {item.question_text}
                    </p>
                  </div>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '99px', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    background: item.obtained_points === item.max_points ? 'rgba(34,197,94,0.12)' : 
                               item.obtained_points > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                    color: item.obtained_points === item.max_points ? '#22c55e' : 
                           item.obtained_points > 0 ? '#f59e0b' : '#ef4444',
                    whiteSpace: 'nowrap',
                    marginLeft: '12px'
                  }}>
                    {item.obtained_points}/{item.max_points}
                  </span>
                </div>
                
                {/* Student's Answer */}
                <div style={{ marginBottom: '8px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Your Answer:</p>
                  <p style={{ fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {formatAnswer(item.answer, questionType, options)}
                  </p>
                </div>
                
                {/* AI Feedback */}
                {item.feedback && (
                  <div style={{ padding: '8px 12px', background: 'rgba(26,58,255,0.08)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '4px' }}>AI Feedback:</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Close Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <button className="btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
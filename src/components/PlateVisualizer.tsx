import React from 'react';
import { calculatePlates } from '../utils/powerlifting';

interface PlateVisualizerProps {
  weight: number;
  barWeight: number;
  availablePlates: number[];
  units: 'kg' | 'lbs';
}

// Map plates to standard IPF/Competition colors and relative heights
const getPlateStyle = (weightVal: number, units: 'kg' | 'lbs') => {

  let color = '#555558'; // grey default
  let height = '80px';
  let width = '14px';
  let labelColor = '#ffffff';

  if (units === 'kg') {
    switch (weightVal) {
      case 25:
        color = '#ef4444'; // Red
        height = '90px';
        width = '18px';
        break;
      case 20:
        color = '#3b82f6'; // Blue
        height = '85px';
        width = '16px';
        break;
      case 15:
        color = '#eab308'; // Yellow
        height = '78px';
        width = '15px';
        labelColor = '#000000';
        break;
      case 10:
        color = '#10b981'; // Green
        height = '70px';
        width = '14px';
        break;
      case 5:
        color = '#f3f4f6'; // White (light grey)
        height = '58px';
        width = '12px';
        labelColor = '#000000';
        break;
      case 2.5:
        color = '#111827'; // Black
        height = '48px';
        width = '10px';
        break;
      case 1.25:
        color = '#6b7280'; // Silver/Grey
        height = '38px';
        width = '8px';
        break;
      default:
        // Fractional plates
        color = '#9ca3af';
        height = '30px';
        width = '6px';
        labelColor = '#000000';
    }
  } else {
    // Lbs color coding
    switch (weightVal) {
      case 55:
        color = '#ef4444'; // Red
        height = '90px';
        width = '18px';
        break;
      case 45:
        color = '#3b82f6'; // Blue
        height = '85px';
        width = '16px';
        break;
      case 35:
        color = '#eab308'; // Yellow
        height = '78px';
        width = '15px';
        labelColor = '#000000';
        break;
      case 25:
        color = '#10b981'; // Green
        height = '70px';
        width = '14px';
        break;
      case 10:
        color = '#111827'; // Black
        height = '50px';
        width = '11px';
        break;
      case 5:
        color = '#f3f4f6'; // White
        height = '42px';
        width = '9px';
        labelColor = '#000000';
        break;
      case 2.5:
        color = '#6b7280'; // Silver
        height = '34px';
        width = '7px';
        break;
      default:
        color = '#9ca3af';
        height = '28px';
        width = '6px';
    }
  }

  return { color, height, width, labelColor };
};

export const PlateVisualizer: React.FC<PlateVisualizerProps> = ({
  weight,
  barWeight,
  availablePlates,
  units,
}) => {
  const { plates, actualWeight } = calculatePlates(weight, barWeight, availablePlates);

  // Grouped plates list to render in sequence on the bar
  const renderedPlatesList: number[] = [];
  plates.forEach((p) => {
    for (let i = 0; i < p.count; i++) {
      renderedPlatesList.push(p.plateWeight);
    }
  });

  return (
    <div style={styles.container}>
      <div style={styles.textDetails}>
        <div style={styles.weightSummary}>
          <span style={styles.actualVal}>{actualWeight} {units}</span>
          {actualWeight !== weight && (
            <span style={styles.targetDiff}>
              (Alvo: {weight} {units})
            </span>
          )}
        </div>
        <div style={styles.subtitle}>
          Cada lado da barra (+ barra de {barWeight} {units})
        </div>
      </div>

      <div style={styles.barbellContainer}>
        {/* Collar Stop (thick ring on the bar) */}
        <div style={styles.collarStop} />
        
        {/* Sleeve of the barbell (where plates go) */}
        <div style={styles.sleeve}>
          {renderedPlatesList.map((plateWeight, idx) => {
            const styleProps = getPlateStyle(plateWeight, units);
            return (
              <div
                key={idx}
                style={{
                  ...styles.plate,
                  backgroundColor: styleProps.color,
                  height: styleProps.height,
                  width: styleProps.width,
                  color: styleProps.labelColor,
                }}
              >
                <span style={styles.plateLabel}>{plateWeight}</span>
              </div>
            );
          })}
          
          {/* Empty space of sleeve if few plates */}
          <div style={styles.sleeveTip} />
        </div>
      </div>

      {plates.length > 0 ? (
        <div style={styles.plateSummaryGrid}>
          {plates.map((p, idx) => (
            <div key={idx} style={styles.summaryItem}>
              <div
                style={{
                  ...styles.summaryBadge,
                  backgroundColor: getPlateStyle(p.plateWeight, units).color,
                  color: getPlateStyle(p.plateWeight, units).labelColor,
                }}
              >
                {p.plateWeight}
              </div>
              <span style={styles.summaryCount}>x {p.count * 2} <span style={styles.mutedText}>({p.count} cada lado)</span></span>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyPrompt}>
          Nenhuma anilha necessária (Apenas a barra limpa)
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
    width: '100%',
  },
  textDetails: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  weightSummary: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '8px',
  },
  actualVal: {
    fontSize: '24px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  },
  targetDiff: {
    fontSize: '14px',
    color: 'var(--error)',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  barbellContainer: {
    display: 'flex',
    alignItems: 'center',
    height: '110px',
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    position: 'relative',
    overflow: 'hidden',
    padding: '0 20px',
  },
  collarStop: {
    width: '12px',
    height: '60px',
    backgroundColor: '#3a3a3c',
    border: '1px solid #555',
    borderRadius: '2px',
    zIndex: 2,
  },
  sleeve: {
    display: 'flex',
    alignItems: 'center',
    height: '24px', // standard barbell sleeve thickness relative to plates
    backgroundColor: '#4e4e50',
    borderTop: '1px solid #777',
    borderBottom: '1px solid #222',
    width: '240px',
    justifyContent: 'flex-start',
    paddingLeft: '2px',
    gap: '2px',
    zIndex: 1,
    borderTopRightRadius: '2px',
    borderBottomRightRadius: '2px',
  },
  sleeveTip: {
    flex: 1,
    height: '100%',
  },
  plate: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
    border: '1px solid rgba(0, 0, 0, 0.4)',
    cursor: 'default',
    userSelect: 'none',
  },
  plateLabel: {
    fontSize: '9px',
    fontWeight: '800',
    transform: 'rotate(-90deg)',
    whiteSpace: 'nowrap',
  },
  plateSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px 16px',
    width: '100%',
    marginTop: '16px',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  summaryBadge: {
    width: '38px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '11px',
    borderRadius: '4px',
    border: '1px solid rgba(0,0,0,0.2)',
  },
  summaryCount: {
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  mutedText: {
    color: 'var(--text-secondary)',
    fontSize: '11px',
    fontWeight: 'normal',
  },
  emptyPrompt: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '12px',
    fontStyle: 'italic',
  },
};
export default PlateVisualizer;

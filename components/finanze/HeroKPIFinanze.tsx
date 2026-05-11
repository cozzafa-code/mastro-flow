"use client";
import React from "react";
import { formatEuro, formatEuroShort, type HeroKPI } from "../../hooks/useFinanze";
import { PASTEL, MUTED, TEXT } from "../../lib/modaleColors";
import { IcoEuro, IcoTrendingUp, IcoAlertTriangle, IcoCheck, IcoUser, IcoBuilding, IcoSparkles } from "../IconLib";

interface Props {
  heroKpi: HeroKPI;
}

export default function HeroKPIFinanze({ heroKpi }: Props) {
  return (
    <div>
      {/* Liquidità HERO grande (full width) */}
      <BigCard
        Ico={IcoEuro}
        color={getColor(heroKpi.liquidita.status, PASTEL.green)}
        label={heroKpi.liquidita.label}
        val={heroKpi.liquidita.val}
        sub={heroKpi.liquidita.sub}
        big
      />

      {/* Griglia 2x2 KPI secondari (incassi/pagamenti/utile/scoperti) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <BigCard
          Ico={IcoTrendingUp}
          color={getColor(heroKpi.incassi.status, PASTEL.teal)}
          label={heroKpi.incassi.label}
          val={heroKpi.incassi.val}
          sub={heroKpi.incassi.sub}
        />
        <BigCard
          Ico={IcoAlertTriangle}
          color={getColor(heroKpi.pagamenti.status, PASTEL.amber)}
          label={heroKpi.pagamenti.label}
          val={heroKpi.pagamenti.val}
          sub={heroKpi.pagamenti.sub}
        />
        <BigCard
          Ico={IcoSparkles}
          color={getColor(heroKpi.utile.status, PASTEL.violet)}
          label={heroKpi.utile.label}
          val={heroKpi.utile.val}
          sub={heroKpi.utile.sub}
          signed
        />
        <BigCard
          Ico={IcoUser}
          color={getColor(heroKpi.scoperti.status, PASTEL.peach)}
          label={heroKpi.scoperti.label}
          val={heroKpi.scoperti.val}
          sub={heroKpi.scoperti.sub}
        />
      </div>

      {/* Riga IVA + Costi */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <BigCard
          Ico={IcoBuilding}
          color={getColor(heroKpi.iva.status, PASTEL.blue)}
          label={heroKpi.iva.label}
          val={heroKpi.iva.val}
          sub={heroKpi.iva.sub}
        />
        <BigCard
          Ico={IcoCheck}
          color={getColor(heroKpi.costi.status, PASTEL.navy)}
          label={heroKpi.costi.label}
          val={heroKpi.costi.val}
          sub={heroKpi.costi.sub}
        />
      </div>
    </div>
  );
}

// =============== BIG CARD ===============
function BigCard({ Ico, color, label, val, sub, big, signed }: any) {
  const valStr = signed && val > 0 ? '+' + formatEuroShort(val) :
                  signed && val < 0 ? formatEuroShort(val) :
                  formatEuroShort(val);

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: big ? '16px 18px' : 12,
      borderLeft: `5px solid ${color.solid}`,
      boxShadow: '0 1px 3px rgba(15,27,45,0.05)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: big ? 8 : 4,
      minHeight: big ? 'auto' : 96,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: big ? 44 : 32,
          height: big ? 44 : 32,
          borderRadius: big ? 12 : 9,
          background: color.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Ico size={big ? 22 : 16} color={color.text} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: big ? 9 : 8,
            color: MUTED,
            letterSpacing: 1,
            fontWeight: 800,
          }}>{label}</div>
        </div>
      </div>

      <div style={{
        fontSize: big ? 30 : 20,
        fontWeight: 800,
        color: color.solid,
        lineHeight: 1.05,
        letterSpacing: -0.5,
      }}>{valStr}</div>

      <div style={{
        fontSize: big ? 11 : 10,
        color: MUTED,
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
      }}>{sub}</div>
    </div>
  );
}

// =============== STATUS → COLOR ===============
function getColor(status: 'ok' | 'warn' | 'bad', defaultColor: any) {
  if (status === 'bad') return PASTEL.red;
  if (status === 'warn') return PASTEL.amber;
  return defaultColor;
}
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export function formatResumeAsMarkdown(content: ResumeContentDto): string {
  const lines: string[] = [];
  const { personal, experience, skills, education } = content;

  // Header
  lines.push(`# ${personal.first_name} ${personal.last_name}`);
  lines.push('');

  if (personal.header_quote) {
    lines.push(`> ${personal.header_quote}`);
    lines.push('');
  }

  // Contact line
  const contact = [
    personal.location,
    personal.email,
    personal.phone,
    `[GitHub](https://github.com/${personal.github})`,
    `[LinkedIn](https://linkedin.com/in/${personal.linkedin})`
  ].filter(Boolean);
  lines.push(contact.join(' · '));
  lines.push('');

  // Experience
  if (experience.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Experience');
    lines.push('');

    for (const exp of experience) {
      lines.push(`### ${exp.title} — ${exp.society}`);
      lines.push(`*${exp.date} · ${exp.location}*`);
      lines.push('');

      if (exp.summary) {
        lines.push(exp.summary);
        lines.push('');
      }

      for (const h of exp.highlights) {
        lines.push(`- ${h}`);
      }
      lines.push('');
    }
  }

  // Skills
  if (skills.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Skills');
    lines.push('');

    for (const skill of skills) {
      lines.push(`**${skill.type}:** ${skill.info}`);
    }
    lines.push('');
  }

  // Education
  if (education.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Education');
    lines.push('');

    for (const edu of education) {
      lines.push(`### ${edu.title} — ${edu.society}`);
      lines.push(`*${edu.date} · ${edu.location}*`);
      lines.push('');
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

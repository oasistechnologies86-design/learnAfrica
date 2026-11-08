import React from 'react';
import {
  ShieldCheck, Scale, Users, LockKeyhole, MessageCircle, Copyright,
  Code2, Activity, Share2, Building2, Landmark, BookOpen, Lightbulb,
  CheckCircle2, ArrowRight, PlayCircle, ClipboardList, Eye, Globe2
} from 'lucide-react';

const lessons = {
  1: {
    title: 'An Overview of Ethics', category: 'Foundations of professional computing',
    intro: 'Understand why technical ability must be guided by sound judgement, fairness and responsibility.',
    outcomes: ['Explain ethics, morals, values, integrity and law.', 'Identify stakeholders and competing duties.', 'Apply a practical ethical decision-making process to Ghana-focused situations.'],
    sections: [
      ['What ethics means', 'Ethics is the reasoned study of what people ought to do. In computing, ethical decisions affect privacy, safety, fairness, access to services, employment and trust. A technical action can be possible without being responsible. An administrator at a Ghanaian college, for example, may technically be able to open a learner’s private academic record, but should do so only for an authorised work purpose and with safeguards recorded.'],
      ['Morals, ethics, values and law', 'Morals are personal or community beliefs about right and wrong. Values are priorities such as honesty, fairness, privacy, loyalty and respect. Ethics evaluates conduct through reasons and principles. Law consists of rules recognised and enforced by a legal system. Law and ethics overlap, but are not identical: an action may be legal yet unfair, or morally motivated yet unlawful. Always identify the jurisdiction before making a legal claim.'],
      ['Integrity, trust and responsibility', 'Integrity means consistency between stated principles and actual behaviour, including when no one is watching. In IT, it includes reporting errors honestly, protecting confidential information, declaring conflicts of interest and admitting the limits of one’s knowledge. Trust is damaged when organisations hide breaches, exaggerate system capabilities or use personal data in unexpected ways.'],
      ['Business ethics and the workplace', 'Business ethics concerns decisions made by organisations and workers. Corporate social responsibility considers effects on employees, customers, suppliers, communities and the environment, not only short-term profit. An ethical workplace has clear standards, leaders who model them, training, fair procedures and safe reporting channels. People who raise concerns in good faith should not be punished for doing so.'],
      ['A practical decision process', 'Describe the problem without assuming the answer. Separate verified facts from assumptions. Identify stakeholders, duties, rights, policies and applicable law. Generate realistic alternatives. Evaluate benefits, harms, fairness, privacy, safety and long-term consequences. Choose and document a defensible option, implement it, then review the outcome.'],
      ['Stakeholders and competing duties', 'Stakeholders include users, customers, workers, owners, suppliers, regulators, students, parents and people indirectly affected. Their interests may conflict. An employer may want extensive monitoring while workers expect privacy. Ethical analysis makes the conflict explicit, considers proportionality and seeks a solution that respects legitimate interests.'],
      ['Ethics in information technology', 'Information can be copied instantly, automated decisions can affect many people, and systems can operate invisibly. Ethical practice therefore requires technical competence together with judgement, transparency, accountability and respect. Privilege, meaning the technical ability to access a system or data, never automatically equals permission.']
    ],
    case: 'A college manager asks an administrator to change a student’s examination result because the student is related to a senior official. Protect record integrity, identify everyone affected, document the request and follow an auditable process. Do not make an exception based on a personal relationship.',
    activity: 'Write approximately 200–300 words identifying the facts and stakeholders in the case, explaining the risks and justifying a responsible response.',
    terms: 'ethics • morality • values • integrity • law • business ethics • corporate social responsibility • stakeholder • accountability • privilege vs permission',
    search: 'introduction to computer ethics university'
  },
  2: {
    title: 'Ethics for IT Workers and IT Users', category: 'Professional conduct and acceptable use',
    intro: 'Explore the responsibilities that come with using, managing and building digital systems.',
    outcomes: ['Explain professional duties and responsible IT use.', 'Apply least privilege and confidentiality.', 'Recognise conflicts of interest, misuse of access and reporting duties.'],
    sections: [
      ['Professional responsibility', 'IT workers may hold privileged access to accounts, networks, databases and devices. That access creates duties: use it only for legitimate work, protect confidential information, follow approved procedures, keep skills current and be honest about risks or limitations. A job title or technical ability does not grant unlimited authority.'],
      ['Least privilege and confidentiality', 'The principle of least privilege means giving each person only the access needed for their assigned tasks, for only as long as it is needed. Accounts should be individual, credentials should not be shared, and important actions should be logged. Confidential information should be viewed, copied or disclosed only when there is a valid purpose and proper authority.'],
      ['Conflicts of interest and misuse', 'A conflict of interest occurs when personal relationships, financial interests or outside activities could improperly influence professional judgement. Examples include changing a learner’s result for a relative, selecting a supplier because of a private benefit, or using institutional equipment for unauthorised work. Disclose conflicts and use independent approval processes.'],
      ['Responsible user behaviour', 'IT users also have responsibilities. Follow acceptable-use policies, respect other people’s accounts and content, protect devices, use licensed software and report suspicious activity. Do not bypass controls, install unauthorised software or use institutional systems to harass, defraud or expose others.'],
      ['Reporting and accountability', 'When a worker discovers a mistake, security weakness or unethical instruction, they should preserve relevant facts and use the organisation’s reporting route. Avoid concealing evidence or making unauthorised changes. Good procedures protect both the organisation and the person raising a concern.']
    ],
    case: 'A support technician is asked by a friend to look up another student’s phone number in the school database. The technician should refuse because friendship is not a work purpose or valid authority.',
    activity: 'Create a short acceptable-use checklist for students and IT support staff. Include access, passwords, privacy, software, reporting and conflicts of interest.',
    terms: 'professional conduct • least privilege • confidentiality • acceptable use • conflict of interest • accountability • audit trail',
    search: 'IT professional ethics code of conduct least privilege'
  },
  3: {
    title: 'Computer and Internet Crime', category: 'Cyber safety and incident response',
    intro: 'Recognise common forms of computer-enabled crime and learn practical prevention and response.',
    outcomes: ['Identify common computer and internet crimes.', 'Explain phishing, malware, identity theft and unauthorised access.', 'Describe basic prevention and incident-response steps.'],
    sections: [
      ['Understanding computer crime', 'Computer and internet crime involves using digital devices, networks or information systems to commit unlawful acts, or targeting those systems themselves. Examples include unauthorised access, online fraud, identity theft, phishing, malware distribution, data theft and service disruption. The same incident may affect individuals, businesses, schools and public services.'],
      ['Phishing and social engineering', 'Phishing uses deceptive messages, websites or calls to persuade people to reveal credentials, send money or install malicious software. Social engineering exploits trust, urgency, fear or curiosity. Check the sender and destination carefully, avoid unexpected attachments, and verify payment or account requests through a separate trusted channel.'],
      ['Malware and unauthorised access', 'Malware includes software designed to damage, disrupt, spy on or gain unauthorised control of a device. It may arrive through unsafe downloads, attachments, removable media or compromised websites. Unauthorised access includes using another person’s credentials, bypassing controls or entering systems without permission.'],
      ['Prevention and response', 'Use unique strong passwords and multi-factor authentication where available. Keep software updated, maintain tested backups, limit privileges and train users to recognise suspicious activity. If an incident occurs, report it promptly, contain the exposure using approved procedures, preserve evidence and logs, recover safely and review what should change.']
    ],
    case: 'A staff member receives an urgent email asking them to reset a payroll password through an unfamiliar link. They should not use the link, should verify the request independently and report the message through the organisation’s security channel.',
    activity: 'Prepare a one-page response checklist for a small college after a staff member reports a suspected phishing message. Include immediate actions and prevention measures.',
    terms: 'phishing • malware • social engineering • identity theft • unauthorised access • incident response • backup • multi-factor authentication',
    search: 'cybersecurity phishing social engineering incident response educational'
  },
  4: {
    title: 'Privacy', category: 'Personal information and responsible data use',
    intro: 'Learn how privacy can be protected throughout the collection, use, storage and sharing of information.',
    outcomes: ['Explain privacy and personal data.', 'Describe privacy risks and safeguards.', 'Apply privacy-by-design and data-minimisation thinking.'],
    sections: [
      ['What privacy means', 'Privacy concerns people’s ability to understand and influence how information about them is collected, used, stored and shared. Personal data is information that identifies or can reasonably be linked to an individual. Digital services may collect names, contact details, location, learning records, device identifiers and other information.'],
      ['Why privacy matters', 'Poor data handling can lead to embarrassment, discrimination, identity theft, financial loss, unwanted profiling or loss of trust. Information gathered for one purpose should not automatically be reused for unrelated purposes. Organisations should explain their practices in clear language and provide appropriate ways for people to exercise their rights.'],
      ['Privacy principles in practice', 'Collect only information that is necessary for a defined purpose. Keep it accurate, protect it against unauthorised access or loss, limit retention and share it only with an appropriate basis and safeguards. Access should be limited to people who need the information for their work.'],
      ['Privacy by design', 'Privacy should be considered from the beginning of a project, not added only after complaints. Teams can reduce risk through data minimisation, access controls, secure defaults, retention limits, clear notices, testing and review. Privacy and security are related but not identical: security protects information, while privacy also concerns whether its collection and use are appropriate.']
    ],
    case: 'A learning platform proposes collecting students’ exact location even though course access only requires an email address and enrolment record. The team should question whether location is necessary and avoid collecting it without a clear, justified purpose.',
    activity: 'Review a familiar website or app privacy notice. Identify the data it collects, why it says it needs the data, who it may share it with and one question a user should ask.',
    terms: 'privacy • personal data • data minimisation • purpose limitation • retention • privacy by design • access control',
    search: 'privacy by design data minimisation personal information'
  },
  5: {
    title: 'Freedom of Expression', category: 'Rights, moderation and online responsibility',
    intro: 'Consider how open expression can be supported while reducing harm and respecting other people.',
    outcomes: ['Explain freedom of expression in digital spaces.', 'Distinguish opinion, criticism, misinformation and harmful conduct.', 'Evaluate moderation decisions and responsible sharing.'],
    sections: [
      ['Expression in digital spaces', 'Digital platforms make it easy to publish opinions, news, criticism, images and creative work to large audiences. Freedom of expression supports discussion, learning, accountability and participation. It does not remove the responsibility to consider the rights, safety and dignity of other people.'],
      ['Balancing competing interests', 'Online expression can raise difficult questions when speech involves threats, harassment, private information, defamation, incitement or misleading claims. Context matters. A fair response considers the content, likely harm, applicable rules, the rights of affected people and whether a less restrictive response is available.'],
      ['Moderation and misinformation', 'Platforms and communities use rules to manage content. Good moderation should be understandable, consistent, proportionate and open to review. Before sharing a dramatic claim, check its source, date, context and confirmation from reliable sources. Do not amplify rumours simply because they provoke a strong reaction.'],
      ['Responsible participation', 'Disagree with ideas without targeting people. Avoid publishing private information, threats or abusive material. Correct errors when you discover them and use reporting or appeal processes responsibly. In educational communities, respectful discussion helps people participate without fear of harassment.']
    ],
    case: 'A student shares an unverified message claiming that a college has cancelled all examinations. Before forwarding it, check official college channels and avoid presenting the rumour as fact.',
    activity: 'Write a short moderation guideline for a class discussion group. Explain how it should handle disagreement, harassment, private information and unverified claims.',
    terms: 'freedom of expression • moderation • misinformation • harassment • proportionality • appeal • digital citizenship',
    search: 'freedom of expression online content moderation digital citizenship'
  },
  6: {
    title: 'Intellectual Property and Copyright', category: 'Ownership, licensing and lawful reuse',
    intro: 'Understand ownership of creative work and how copyright, open licences and copyleft affect reuse.',
    outcomes: ['Explain copyright and intellectual property.', 'Distinguish public domain, permissions and licences.', 'Interpret Creative Commons BY, NC, ND and SA conditions and copyleft.'],
    sections: [
      ['Intellectual property and copyright', 'Intellectual property refers to creations and certain forms of knowledge or identifiers protected by law. Copyright generally protects original expression such as writing, photographs, music, films, artwork and software. It does not mean that every idea or fact is owned in the same way. Users should check the applicable rules and licence before copying or distributing a work.'],
      ['Public domain and permission', 'A work in the public domain is not restricted by copyright in the relevant jurisdiction, although other rights or conditions may still matter. A work being available online does not mean it is free to reuse. When a work is protected, reuse may require permission, a valid licence or a legal exception. Keep records of the source and terms.'],
      ['Creative Commons licences', 'Creative Commons provides standard licences that communicate permissions and conditions. BY requires attribution. NC restricts commercial use. ND does not allow distribution of adapted material. SA requires adaptations to be shared under the same licence. These elements combine into the standard licences: BY, BY-SA, BY-ND, BY-NC, BY-NC-SA and BY-NC-ND.'],
      ['CC0 and copyleft', 'CC0 is a public-domain dedication tool intended to waive rights as far as legally possible. Copyleft uses copyright licensing to permit use, modification and redistribution while requiring specified freedoms to remain available under the same or compatible terms. The GNU General Public License (GPL) is a well-known software copyleft licence.'],
      ['Responsible reuse', 'Before using an image, article, video, dataset or software package, identify its creator, licence, permitted uses, attribution requirements and any restrictions on commercial use or adaptations. Attribution alone does not automatically grant permission for every kind of reuse.']
    ],
    case: 'A lecturer wants to place an online photograph in paid course material. Before using it, check who owns it and whether the licence permits commercial reuse and any required adaptations.',
    activity: 'Find one Creative Commons-licensed image and record its creator, source, exact licence, attribution wording and whether commercial reuse or adaptation is allowed.',
    terms: 'intellectual property • copyright • public domain • licence • attribution • Creative Commons • BY • NC • ND • SA • CC0 • copyleft • GNU GPL',
    search: 'Creative Commons licences BY NC ND SA explained official'
  },
  7: {
    title: 'Software Development', category: 'Ethical design and responsible engineering',
    intro: 'Apply ethical thinking throughout software planning, design, development, testing and maintenance.',
    outcomes: ['Identify ethical risks in software projects.', 'Explain the importance of requirements, testing and accessibility.', 'Apply privacy, security, fairness and accountability throughout development.'],
    sections: [
      ['Ethics throughout the development lifecycle', 'Software decisions affect people long after a system is released. Ethical practice should be considered during requirements gathering, design, implementation, testing, deployment and maintenance. Teams should ask who may benefit, who may be excluded, what data is required and what could go wrong.'],
      ['Requirements and design', 'Requirements should reflect real user needs and relevant obligations. Include accessibility, privacy, security, reliability and understandable communication. Avoid collecting unnecessary personal data or designing interfaces that manipulate users into choices they do not understand.'],
      ['Testing and quality', 'Testing should cover expected behaviour, failures, security, usability and accessibility. Include users with different needs and devices where possible. Document defects and known limitations. Do not conceal serious problems merely to meet a release date.'],
      ['Deployment and maintenance', 'After release, monitor performance and security, provide updates, respond to incidents and review user feedback. When software makes decisions that significantly affect people, provide suitable transparency, human review and a way to correct errors.']
    ],
    case: 'A team discovers that its automated scholarship screening tool wrongly excludes applicants whose names contain certain characters. The team should pause or limit the harmful decision, investigate the cause, correct the rule and provide human review.',
    activity: 'Sketch a simple development checklist for a student-record application. Include requirements, privacy, security, accessibility, testing, deployment and maintenance.',
    terms: 'software lifecycle • requirements • accessibility • usability • quality assurance • testing • privacy by design • maintenance • human oversight',
    search: 'ethical software development lifecycle privacy by design accessibility'
  },
  8: {
    title: 'Impact of Information Technology on Productivity and Quality of Life', category: 'Technology and society',
    intro: 'Evaluate how IT changes work, education, health, access, communities and the environment.',
    outcomes: ['Describe positive and negative effects of IT.', 'Explain the digital divide and changing work patterns.', 'Evaluate sustainability and quality-of-life impacts.'],
    sections: [
      ['Productivity and opportunity', 'Information technology can make communication faster, support remote collaboration, improve record keeping and provide access to education, health information and financial services. Automation can reduce repetitive work and help organisations make services available to more people.'],
      ['Risks and unequal access', 'Benefits are not shared equally. The digital divide refers to unequal access to devices, connectivity, affordability, skills and accessible services. Poorly designed systems can exclude people with disabilities, people in areas with weak connectivity and users who cannot afford suitable devices or data.'],
      ['Work and quality of life', 'Technology can create new jobs and skills while changing or replacing some tasks. Constant connectivity can also increase stress, blur work-life boundaries and create expectations of continuous availability. Organisations should consider training, fair working practices and the human effects of automation.'],
      ['Health and environment', 'Digital tools can support health services and learning, but excessive or poorly managed use may affect wellbeing. Devices and data centres consume resources, and discarded electronics create environmental challenges. Responsible choices include repair, reuse, energy efficiency and safe e-waste handling.']
    ],
    case: 'A school moves all learning materials online, but some students have unreliable internet and share one phone with family members. The school should consider offline access, downloadable resources and reasonable alternatives.',
    activity: 'Choose one technology used in Ghanaian education, work or health. List three benefits, three risks and two practical steps to make its benefits more inclusive and sustainable.',
    terms: 'productivity • digital divide • automation • accessibility • remote work • quality of life • sustainability • e-waste',
    search: 'digital divide technology productivity sustainability quality of life'
  },
  9: {
    title: 'Social Networking', category: 'Digital identity and online communities',
    intro: 'Use social networks thoughtfully and understand how online activity affects privacy and reputation.',
    outcomes: ['Explain digital footprints and online reputation.', 'Identify privacy and security risks on social platforms.', 'Practise responsible sharing and communication.'],
    sections: [
      ['Social networking and identity', 'Social networks help people communicate, learn, organise activities and build professional connections. Posts, comments, images, likes and shared information can contribute to a digital footprint. Content may be copied, searched, archived or viewed outside its original audience.'],
      ['Privacy and security', 'Review audience settings, limit unnecessary personal details and be cautious with location sharing. Use strong unique passwords and multi-factor authentication where available. Be alert to impersonation, scams, suspicious links and requests for sensitive information.'],
      ['Reputation and respectful conduct', 'Before posting, consider accuracy, audience, permanence and possible effects on other people. Ask permission before sharing someone else’s image or private information. Avoid harassment, impersonation and spreading unverified claims. Correct mistakes and report harmful behaviour through appropriate channels.'],
      ['Professional use', 'Employers, clients, institutions and professional communities may encounter public online content. Keep professional communication respectful and accurate. Do not disclose confidential work information or assume that a private group guarantees confidentiality.']
    ],
    case: 'A student posts a photograph of classmates during a private event without asking them. The student should consider consent, remove the image if requested and avoid sharing private details.',
    activity: 'Review your own public social profile from the perspective of a future employer. Identify three things that support a positive digital footprint and three privacy or reputation risks to address.',
    terms: 'social networking • digital footprint • online reputation • privacy settings • impersonation • consent • professional identity',
    search: 'digital footprint online reputation social media privacy'
  },
  10: {
    title: 'Ethics of IT Organisations', category: 'Governance and organisational accountability',
    intro: 'Examine how technology organisations govern risk, suppliers, workers and responsibilities to society.',
    outcomes: ['Explain organisational ethics and IT governance.', 'Identify outsourcing and supplier risks.', 'Describe accountability, transparency and corporate responsibility.'],
    sections: [
      ['Organisational ethics and governance', 'IT organisations make decisions about products, data, workers, customers, suppliers and communities. Governance provides structures for direction, oversight, risk management and accountability. Ethical leadership should be reflected in policies, budgets, incentives and everyday decisions, not only public statements.'],
      ['Transparency and accountability', 'Organisations should communicate honestly about what their systems do, what information they collect and what risks remain. They should assign responsibility for important decisions, keep appropriate records, investigate concerns and correct failures. Hiding defects or exaggerating capabilities damages trust.'],
      ['Outsourcing and supplier risk', 'Using external providers can offer expertise and efficiency, but it does not remove an organisation’s responsibilities. Assess supplier security, reliability, privacy practices, service continuity, subcontractors and contractual safeguards. Monitor performance and plan for failure or exit.'],
      ['People and social responsibility', 'Responsible organisations consider fair working conditions, accessibility, environmental effects, truthful marketing, product safety and the wider impact of automation. Whistleblowing and internal reporting channels should be safe and handled impartially.']
    ],
    case: 'A learning provider stores student records with an external cloud supplier. The provider should assess the supplier, define permitted processing and security responsibilities, monitor compliance and plan how records can be recovered or transferred.',
    activity: 'Prepare a supplier assessment checklist for a small organisation choosing a cloud service. Include security, privacy, availability, support, contracts and exit arrangements.',
    terms: 'IT governance • accountability • transparency • outsourcing • supplier risk • corporate social responsibility • whistleblowing • audit',
    search: 'IT governance outsourcing supplier risk corporate social responsibility'
  },
  11: {
    title: 'Ghana Data Protection Act, 2012 (Act 843)', category: 'Ghanaian data protection framework',
    intro: 'Study the core data protection concepts in Ghana and how organisations should handle personal data responsibly.',
    outcomes: ['Identify key roles under Act 843.', 'Explain core data protection principles.', 'Recognise individual rights and organisational responsibilities.'],
    sections: [
      ['Purpose and scope', 'Ghana’s Data Protection Act, 2012 (Act 843) establishes a framework for protecting personal data and regulating its processing. This lesson is an educational overview, not legal advice. Refer to the legislation and current Data Protection Commission guidance when interpreting duties or compliance requirements.'],
      ['Key roles', 'A data subject is the individual to whom personal data relates. A data controller determines the purposes for and manner in which personal data is processed. A data processor processes personal data on behalf of a controller. The Data Protection Commission is the regulator established under the Act.'],
      ['Core principles', 'The Act addresses accountability, lawfulness of processing, specification of purpose, compatibility of further processing, quality of information, openness, data security safeguards and data subject participation. In practice, organisations should know why they collect information, keep it accurate, protect it and avoid incompatible reuse.'],
      ['Security and organisational duties', 'Organisations should apply safeguards appropriate to the information and risks, restrict access, train staff and respond to suspected exposure. The course pack notes registration duties for data controllers; current registration and compliance procedures should be checked directly with the Data Protection Commission. Outsourcing processing does not make accountability disappear.'],
      ['Data subject participation', 'People should be able to engage with organisations about personal data concerning them, including requests relating to access or correction under the applicable framework. Organisations need clear procedures to receive, verify and respond to such requests while protecting other people’s information.'],
      ['Ghana-focused practice', 'A Ghanaian learning platform may hold names, contact details, course progress, assessment records and payment references. It should identify its purposes, collect only necessary information, explain its practices, limit staff access, secure records and use documented procedures when information is corrected, disclosed or exposed.']
    ],
    case: 'An administrator discovers a public link exposing learner marks. The organisation should contain the exposure, preserve relevant evidence, report through its incident process and assess the next steps under its policies and applicable Act 843 obligations.',
    activity: 'Map the personal data a learning platform may collect. For each item, state the purpose, who needs access, how it should be protected and when it should be reviewed or deleted.',
    terms: 'Act 843 • personal data • data subject • data controller • data processor • Data Protection Commission • accountability • purpose specification • data security',
    search: 'Ghana Data Protection Act 2012 Act 843 Data Protection Commission'
  }
};

const icons = [Scale, ShieldCheck, LockKeyhole, Eye, MessageCircle, Copyright, Code2, Activity, Share2, Building2, Landmark];
const palettes = [
  ['#183d35','#d8eee5'],['#243c64','#dce8fb'],['#603b24','#f4e3d4'],['#274b59','#d9edf1'],
  ['#59416d','#eee1f7'],['#744b24','#f5e8d4'],['#244c72','#dceafb'],['#28634f','#dcefe5'],
  ['#75435d','#f4e0eb'],['#3f4d63','#e0e7f0'],['#235c58','#dcefeb']
];

function LessonIllustration({ number, title }) {
  const Icon = icons[number - 1] || BookOpen;
  const colors = palettes[number - 1] || palettes[0];
  return (
    <div className="relative min-h-[190px] sm:min-h-[235px] overflow-hidden rounded-2xl p-5 sm:p-7 flex items-center" style={{background: 'linear-gradient(125deg,' + colors[0] + ',#152d3b)'}}>
      <div className="absolute -right-8 -top-12 h-52 w-52 rounded-full border-[24px] opacity-10" style={{borderColor:colors[1]}} />
      <div className="absolute right-8 bottom-[-55px] h-40 w-40 rounded-full border-[18px] opacity-10" style={{borderColor:colors[1]}} />
      <div className="relative z-10 max-w-[70%] text-white">
        <span className="text-[10px] sm:text-xs uppercase tracking-[.22em] font-bold opacity-75">Professional Computing · Lesson {number}</span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight">{title}</h2>
        <p className="mt-3 text-xs sm:text-sm text-white/75">Learn the concepts. Explore the examples. Apply them responsibly.</p>
      </div>
      <div className="absolute right-5 sm:right-10 top-1/2 -translate-y-1/2 h-24 w-24 sm:h-32 sm:w-32 rounded-[28px] flex items-center justify-center shadow-2xl rotate-3" style={{background:colors[1],color:colors[0]}}>
        <Icon className="h-12 w-12 sm:h-16 sm:w-16" strokeWidth={1.5}/>
      </div>
      <div className="absolute bottom-3 right-4 text-[9px] tracking-widest uppercase text-white/45">LEARN AFRICA</div>
    </div>
  );
}

function Section({ title, children, index }) {
  return <section className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
    <div className="flex gap-3 items-start">
      <span className="shrink-0 h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">{index}</span>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-3 text-sm sm:text-[15px] leading-7 text-foreground/85">{children}</p>
      </div>
    </div>
  </section>;
}

export default function ProfessionalComputingLesson({ student, lesson }) {
  const match = String(lesson?.component_key || lesson?.componentKey || '').match(/professional-computing-(\d{2})/);
  const number = match ? Number(match[1]) : 1;
  const data = lessons[number] || lessons[1];
  const Icon = icons[number - 1] || BookOpen;
  const firstName = (student?.name || '').trim().split(/\s+/)[0];

  return <div className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8 pb-8">
    <LessonIllustration number={number} title={data.title}/>
    <header className="space-y-3 px-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold">{data.category}</span>
        <span className="text-xs text-muted-foreground">Reading first · Video next · Practical activity</span>
      </div>
      <p className="text-base sm:text-lg leading-7 text-muted-foreground">{firstName ? 'Hello ' + firstName + '. ' : ''}{data.intro}</p>
    </header>
    <section className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-4"><BookOpen className="h-5 w-5 text-primary"/><h3 className="text-lg font-bold">What you will learn</h3></div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.outcomes.map((item,i)=><li key={i} className="flex gap-2 text-sm leading-6"><CheckCircle2 className="h-4 w-4 mt-1 shrink-0 text-primary"/><span>{item}</span></li>)}
      </ul>
    </section>
    <div className="flex items-center gap-3 px-1"><span className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><BookOpen className="h-4 w-4"/></span><div><h2 className="text-xl sm:text-2xl font-extrabold">Lesson reading</h2><p className="text-xs text-muted-foreground">Work through each section before moving to the video</p></div></div>
    <div className="space-y-4">
      {data.sections.map((section,i)=><Section key={i} title={section[0]} index={i+1}>{section[1]}</Section>)}
    </div>
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-7">
      <div className="flex gap-2 items-center text-primary"><Lightbulb className="h-5 w-5"/><h3 className="font-bold text-lg">Ghana-focused example</h3></div>
      <p className="mt-3 text-sm sm:text-[15px] leading-7">{data.case}</p>
    </section>
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary"/><h3 className="text-lg font-bold">Key terms</h3></div>
      <div className="mt-4 flex flex-wrap gap-2">{data.terms.split(' • ').map((term,i)=><span key={i} className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium">{term}</span>)}</div>
    </section>
    <section className="rounded-2xl overflow-hidden border border-border">
      <div className="p-5 sm:p-7 bg-slate-950 text-white">
        <div className="flex gap-2 items-center text-cyan-300"><PlayCircle className="h-5 w-5"/><span className="text-xs font-bold uppercase tracking-wider">Next · Video learning</span></div>
        <h3 className="mt-3 text-xl sm:text-2xl font-extrabold">Watch the lesson video</h3>
        <p className="mt-2 text-sm leading-6 text-white/75">Use this YouTube search phrase to select a suitable educational video:</p>
        <p className="mt-3 rounded-xl bg-white/10 p-3 text-sm font-semibold">{data.search}</p>
        <a className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-100" href={'https://www.youtube.com/results?search_query='+encodeURIComponent(data.search)} target="_blank" rel="noreferrer">Find a lesson video <ArrowRight className="h-4 w-4"/></a>
        <p className="mt-3 text-xs text-white/55">The course pack provides search phrases, not verified individual video selections. Check the presenter, accuracy, date and relevance before embedding a video in the course.</p>
      </div>
    </section>
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary"/><h3 className="text-lg font-bold">Practical activity</h3></div>
      <p className="mt-4 text-sm sm:text-[15px] leading-7">{data.activity}</p>
    </section>
    <footer className="rounded-2xl bg-muted/40 border border-border p-5 sm:p-6">
      <div className="flex gap-3 items-start"><Icon className="h-5 w-5 mt-0.5 text-primary"/><div><h3 className="font-bold">Before you continue</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Review the key terms, complete the practical activity and then use the separate lesson assessment in the course navigation. Your assessment settings and attempt rules are managed by Learn Africa’s existing quiz system.</p></div></div>
    </footer>
  </div>;
}

export { lessons as professionalComputingLessons };

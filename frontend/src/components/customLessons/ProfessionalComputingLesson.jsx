import React from 'react';
const lessons = {
  1: {
    title: 'An Overview of Ethics', category: 'Foundations of professional computing',
    intro: 'Understand why technical ability must be guided by sound judgement, fairness and responsibility.',
    outcomes: ['Explain the difference between ethics, morals, values, integrity and law.', 'Identify the people affected by an IT decision and the duties owed to them.', 'Use a clear decision-making process to handle ethical situations in Ghana.'],
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

function Section({ title, children }) {
  const paragraphs = String(children || '').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  return (
    <section className="custom-lesson-section">
      <h2>{title}</h2>
      {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </section>
  );
}

const expandedSections = {
  1: [
    ['Ethical theories and how to use them', 'Consequentialist reasoning evaluates an action by considering its likely outcomes. A decision that produces substantial benefit while reducing avoidable harm may be preferable, but the analysis must include people who are not present in the room and harms that may occur later. A utilitarian approach asks whether overall well-being is increased; it should not be used carelessly to dismiss the rights of a smaller group.\n\nDuty-based reasoning focuses on obligations and principles, such as honesty, respect for persons, keeping promises and avoiding deception. Rights-based reasoning asks whether a decision respects legitimate claims such as privacy, autonomy and fair treatment. Virtue ethics considers the character traits a good professional should demonstrate, including honesty, courage, fairness, patience and practical wisdom. These approaches are not competing checklists with one automatic answer. Used together, they expose different dimensions of a difficult decision.'],
    ['Critical thinking, evidence and ethical justification', 'An ethical argument should begin with a clear description of the problem and reliable evidence. Separate what is known from what is assumed, identify missing information and check whether the evidence is current and relevant. For example, a report that a student account accessed a record does not by itself prove misconduct: the access may have been authorised, mistaken or malicious. Logs, access policies, the user’s role and the purpose of the activity need to be examined.\n\nA defensible decision explains which principles apply, who may be affected, what alternatives were considered and why the selected action is proportionate. It should also identify uncertainty and provide a way to review the result. This makes ethical reasoning transparent and helps organisations learn from mistakes rather than relying on personal opinion or seniority.']
  ],
  2: [
    ['Professional codes, competence and duty of care', 'Professional codes translate broad ethical values into expectations for practice. The ACM Code of Ethics, for example, emphasises the public good, avoiding harm, honesty, fairness, privacy and professional competence. A code does not replace legislation, employment policies or careful judgement; it helps professionals recognise duties that may not be obvious from a technical specification. When duties conflict, professionals should explain the conflict, seek guidance and document their reasoning.\n\nCompetence is an ethical responsibility because poor technical work can expose people to harm. IT workers should maintain relevant knowledge, test changes, understand the limits of their expertise and ask for help when a task exceeds their ability. A technician should not claim a system is secure merely because it passed a basic test. They should communicate residual risks in language decision-makers can understand.'],
    ['Acceptable-use policies and separation of duties', 'An acceptable-use policy should explain which systems and resources may be used, for what purposes, and which activities are prohibited. It should be communicated in accessible language and applied consistently. Policies should address personal use, software installation, internet access, monitoring, storage of work files, reporting incidents and consequences for misuse. Monitoring should itself be lawful, necessary, proportionate and transparent.\n\nSeparation of duties reduces the chance that one person can make and conceal a high-impact change. For example, a staff member who enters examination results should not be the only person who approves and publishes them. Approval workflows, individual accounts, audit logs and periodic access reviews provide evidence and reduce opportunities for favouritism or fraud.']
  ],
  3: [
    ['Common categories of cybercrime and their effects', 'Cybercrime includes offences in which computers or networks are the target, the instrument, or the environment in which the offence occurs. Attacks against systems include unauthorised access, interference with data, disruption of services and deployment of ransomware. Computer-enabled offences include online impersonation, payment fraud, identity theft, extortion and the distribution of deceptive material. The categories can overlap: a stolen password may be used to enter a school system and then alter records or demand money.\n\nThe impact is not limited to the cost of replacing equipment. A compromised account can expose personal information, interrupt teaching, damage an organisation’s reputation and undermine confidence in digital services. A school or small business may also face recovery costs, lost working time, investigation expenses and legal or regulatory obligations. Victims should not be blamed for being deceived; organisations need controls and reporting processes that make it easier to respond quickly.'],
    ['Digital evidence and incident handling', 'Digital evidence may include email headers, message content, access logs, timestamps, device records, transaction references and network information. It can be altered or lost if people casually delete messages, reset devices or forward suspicious files. Preserve evidence using approved procedures, record who handled it and when, and avoid investigating beyond your authority. Staff should report what they observed without editing or embellishing the facts.\n\nA structured response normally involves preparation, identification, analysis, containment, eradication, recovery and lessons learned. Prioritise safety and continuity, isolate affected systems when authorised, reset credentials through trusted channels and restore from clean tested backups. NIST’s Cybersecurity Framework 2.0 describes coordinated response, analysis, mitigation and recovery activities; an organisation should adapt its plan to its size, legal duties and available resources.']
  ],
  4: [
    ['The data lifecycle and privacy risks', 'Privacy risks arise at every stage of the data lifecycle: collection, recording, storage, access, use, sharing, retention and disposal. A spreadsheet containing student phone numbers may be harmless when held by an authorised staff member for a clear purpose, but risky when copied to a personal device, shared in a public group or retained after the purpose has ended. Combining separate datasets can also reveal information that was not obvious from either dataset alone.\n\nData minimisation means limiting collection to what is adequate, relevant and necessary for the stated purpose. Purpose limitation means not quietly reusing information for a new and incompatible purpose. Retention limits reduce the amount of information exposed if an account or device is compromised. Secure deletion should cover working copies and backups according to a documented schedule rather than relying on the belief that moving a file to a recycle bin has erased it.'],
    ['Consent, transparency and privacy impact assessment', 'Consent can be important, but it is not a universal solution to every privacy question. A request for consent should be understandable, specific and freely made; people should not be misled about what will happen if they refuse. Depending on the context and applicable law, an organisation may rely on another lawful justification. The organisation must identify the correct basis rather than treating a pre-ticked box as proof that all processing is appropriate.\n\nA privacy impact assessment is a structured way to identify how a proposed system may affect individuals. It asks what information is collected, why it is needed, who can access it, how long it is kept, where it is transferred, what could go wrong and how risks will be reduced. The assessment should be revisited when the system, purpose, supplier or data categories change. Privacy notices should match actual practice, not simply describe an ideal policy.']
  ],
  5: [
    ['Rights, limits and the public interest', 'Freedom of expression protects the ability to seek, receive and communicate ideas, criticism and information. It supports academic debate, journalism, civic participation and the ability to question institutions. Digital platforms can widen participation, but they also allow messages to spread rapidly and persist beyond their original context. A responsible discussion distinguishes criticism of an idea or public decision from targeted abuse, threats or disclosure of another person’s private information.\n\nExpression may be subject to lawful restrictions in particular circumstances, but restrictions should not be assumed merely because a statement is unpopular or uncomfortable. Assessment requires attention to the relevant jurisdiction, the exact content, context, purpose, audience, foreseeable harm and applicable law or platform rules. Students should not treat a platform’s community guidelines as identical to national law, nor assume that every moderation decision is automatically fair.'],
    ['Misinformation, disinformation and content moderation', 'Misinformation is false or inaccurate information shared without necessarily intending to deceive. Disinformation is deliberately created or shared to mislead. Malinformation uses genuine information in a harmful context, such as exposing private details to intimidate someone. These distinctions help explain why fact-checking alone may not address harassment or privacy violations.\n\nA sound moderation process publishes clear rules, applies them consistently, considers context, explains important decisions and provides an appeal route where practical. Responses should be proportionate: a reminder or correction may be enough for a minor mistake, while a credible threat may require urgent escalation. Before sharing a claim, check the original source, date, supporting evidence and independent confirmation. Screenshots can omit context, and a high number of shares does not establish truth.']
  ],
  6: [
    ['Other forms of intellectual property and software licensing', 'Copyright is only one part of intellectual property. Trademarks help distinguish the goods or services of one organisation from another. Patents may protect qualifying inventions for a limited period where statutory requirements are met. Trade secrets protect confidential business information when reasonable steps are taken to keep it secret. These rights have different purposes and rules; a logo, a source-code file and a technical invention should not automatically be analysed under the same legal category.\n\nSoftware licences define permissions and obligations for using, copying, modifying and distributing software. Proprietary licences may restrict access to source code or limit installation and redistribution. Open-source licences permit specified uses and access to source code, but they still have conditions. Some licences are permissive, while copyleft licences such as the GNU GPL require distributed derivative works to preserve specified freedoms. Read the exact licence and version before incorporating a dependency into a project.'],
    ['Attribution, fair dealing and responsible course materials', 'Attribution identifies the creator and source, but attribution alone does not make an otherwise unauthorised use lawful. A lecturer preparing course materials should check the licence, permission, applicable exceptions and whether the proposed use is commercial or public distribution. The rules and scope of exceptions differ by jurisdiction, so a user should not assume that a practice permitted in one country is automatically permitted in Ghana.\n\nKeep a record of the creator, title, source URL, licence version, date accessed and any changes made. For software, also retain licence files and notices required by dependencies. For images and media, avoid removing watermarks or creator information. If the licence is unclear, choose a clearly licensed alternative or request permission before publishing.']
  ],
  7: [
    ['Requirements, stakeholder participation and inclusive design', 'Software requirements should describe the problem to be solved, the people who will use or be affected by the system, and the conditions under which it must operate. Requirements gathering should include different user groups rather than relying only on the assumptions of the project sponsor. A system designed for a fast laptop and stable broadband may fail for a student using an older phone and limited mobile data.\n\nInclusive design considers disability, language, device capability, connectivity, age, digital confidence and different working environments. Accessibility features such as keyboard operation, readable contrast, captions, labels and screen-reader support should be built into the design and tested. Security and privacy requirements should be written as testable requirements, not vague statements such as “make it safe.”'],
    ['Secure engineering, testing and responsible release', 'Secure software development uses threat modelling, code review, dependency management, secure configuration, secrets protection and testing throughout the lifecycle. Teams should validate input, handle errors safely, protect credentials, apply least privilege and keep third-party components updated. A vulnerability in a library can affect an application even when the organisation did not write that library itself.\n\nTesting should include normal use, unusual input, boundary conditions, accessibility, performance, recovery and security. A release decision should consider the severity and likelihood of known defects, the users who may be harmed and whether safeguards or workarounds are available. After release, teams need monitoring, patching, support, backup and a plan for retiring the system. Responsible engineering continues for as long as people depend on the software.']
  ],
  8: [
    ['Measuring productivity and evaluating automation', 'Productivity is not simply the number of tasks completed per hour. A useful evaluation considers output quality, error rates, service reliability, time saved, costs, user satisfaction and the resources required to maintain the system. Automation may speed up a process while creating new work such as exception handling, data correction, supervision and staff training. A system that produces more results but introduces serious errors may reduce overall productivity.\n\nBefore automating a process, understand how it currently works and identify the causes of delay or error. Define measurable outcomes, test with realistic data and compare results after implementation. Consider who benefits from the time saved and whether workers receive training for changing responsibilities. Human review is especially important when automated outputs affect education, employment, finance, health or access to essential services.'],
    ['Digital inclusion, wellbeing and environmental sustainability', 'The digital divide includes more than whether a household owns a computer. It also concerns reliable electricity, affordable data, network coverage, accessible devices, relevant language, digital skills and the ability to use services safely. An inclusive organisation may provide mobile-friendly pages, low-bandwidth alternatives, downloadable resources, offline support and accessible formats. These choices are particularly important when a digital service becomes the only route to an essential opportunity.\n\nTechnology can improve access and flexibility, but constant notifications, surveillance, poor ergonomics and expectations of permanent availability can affect wellbeing. Electronic devices also require materials, energy and responsible end-of-life handling. Repair, reuse, secure data wiping, certified recycling and efficient infrastructure reduce avoidable harm. UNESCO’s 2023 Global Education Monitoring report cautions that education technology should be assessed for equity, evidence, appropriateness and sustainability rather than assumed to benefit every learner automatically.']
  ],
  9: [
    ['Algorithms, platform design and personal data', 'Social networks organise content through feeds, recommendations, search, advertising and moderation systems. These systems may use information such as follows, clicks, viewing time, location, contacts and inferred interests. A recommendation system can help users discover relevant material, but it can also repeatedly expose them to sensational or one-sided content. Users should understand that the order of posts is often selected by software rather than being a neutral view of everything published.\n\nPrivacy settings are useful but do not guarantee confidentiality. A recipient can take a screenshot, copy a message or share a post outside its intended audience. Platforms may also retain information under their own policies and legal obligations. Avoid sharing passwords, one-time codes, identity documents or sensitive location details through direct messages, and verify requests using a separate trusted channel.'],
    ['Cyberbullying, safety and professional boundaries', 'Cyberbullying and online harassment can involve repeated insults, threats, impersonation, unwanted contact, coordinated humiliation or sharing private material without permission. Preserve relevant evidence, use platform reporting tools and seek help from trusted people or appropriate authorities when there is a credible threat. Do not retaliate by publishing another person’s private details; doing so can escalate harm and create further risk.\n\nProfessional identity requires care because public posts may be viewed by classmates, employers, clients and colleagues. Separate personal and work accounts where appropriate, follow workplace confidentiality rules and avoid presenting personal opinions as official organisational statements. Before posting, consider whether the content is accurate, respectful, necessary and suitable for the intended audience.']
  ],
  10: [
    ['Governance, risk management and internal controls', 'IT governance connects technology decisions to an organisation’s goals, obligations and risk appetite. It clarifies who approves major changes, who owns information assets, who monitors security and who is accountable when a service fails. Policies are useful only when responsibilities, resources, training and oversight are in place. Boards and senior leaders should receive information that allows them to understand significant technology risks without relying solely on technical assurances.\n\nInternal controls include approval workflows, access reviews, separation of duties, change management, audit logs, incident exercises and independent assurance. Controls should be proportionate to the organisation’s size and the sensitivity of its systems. Too few controls invite misuse; unnecessarily complex controls can prevent staff from doing legitimate work and encourage unsafe workarounds.'],
    ['Supplier management, transparency and social impact', 'Supplier due diligence should examine financial stability, security practices, data locations, subcontractors, service availability, support arrangements, incident notification, business continuity and the ability to return or securely delete information at the end of a contract. Contracts should identify responsibilities and service expectations, but an organisation must also monitor whether the supplier performs as promised. A backup or exit plan should be tested before a crisis.\n\nEthical organisational conduct also includes fair employment practices, accessible products, honest marketing, environmental responsibility and attention to unintended effects of automation. Leaders shape culture through the behaviour they reward and tolerate. If employees are punished for reporting defects, problems are likely to remain hidden. A safe reporting route, fair investigation and protection against retaliation help organisations identify problems early.']
  ],
  11: [
    ['Applying Act 843 to real organisational processes', 'The Act’s principles should be reflected in day-to-day decisions, not treated as a paragraph in a privacy policy. A school collecting learner details should explain the purpose, collect only relevant information, keep records accurate, protect them against unauthorised access and avoid using them for unrelated activities without an appropriate basis. Staff should know which records they may access and how to handle requests from learners or their authorised representatives.\n\nA data controller determines the purposes and manner of processing, while a data processor handles personal data on behalf of a controller. The roles should be identified in contracts and operating procedures. Outsourcing hosting, email or payment processing does not remove the controller’s need to understand the processing, select suitable providers and monitor safeguards. The Data Protection Commission publishes current guidance and operates registration and compliance processes; organisations should verify current requirements directly with the Commission.'],
    ['Rights, safeguards and responding to a suspected compromise', 'Data subject participation includes mechanisms for people to engage with organisations about personal information concerning them. Procedures should explain how requests are received, identity is verified, records are located and responses are provided while protecting the information of other people. Staff should not disclose a complete class list or another person’s record simply because a requester asks for it.\n\nIf a record is exposed, the organisation should contain the incident, preserve evidence, identify the information and people potentially affected, involve the responsible privacy and security personnel, and follow applicable notification and reporting requirements. The exact legal response depends on the facts and current law; this course is not a substitute for legal advice. Consult the full Act and current Data Protection Commission guidance before making compliance decisions.']
  ]
};

const furtherReading = [
  { label: 'Herman T. Tavani, Ethics and Technology (Wiley companion contents)', url: 'https://bcs.wiley.com/he-bcs/Books?action=contents&bcsId=8462&itemId=1118281721' },
  { label: 'ACM Code of Ethics and Professional Conduct', url: 'https://www.acm.org/code-of-ethics' },
  { label: 'Ghana Data Protection Commission guidance', url: 'https://dpc.gov.gh/compliance/' },
  { label: 'Ghana Data Protection Act, 2012 (Act 843) — full legislation', url: 'https://ghalii.org/akn/gh/act/2012/843/eng@2012-05-18' },
  { label: 'NIST Cybersecurity Framework 2.0', url: 'https://www.nist.gov/cyberframework' },
  { label: 'Creative Commons licence explanations', url: 'https://creativecommons.org/cc-licenses/' },
  { label: 'UNESCO 2023 Global Education Monitoring Report: Technology in education', url: 'https://gem-report-2023.unesco.org/' }
];

export default function ProfessionalComputingLesson({ lesson }) {
  const match = String(lesson?.component_key || lesson?.componentKey || '').match(/professional-computing-(\d{2})/);
  const number = match ? Number(match[1]) : 1;
  const data = lessons[number] || lessons[1];

  return (
    <article className="w-full max-w-none mx-0 py-4 sm:py-6 px-0 space-y-5">
      <header className="space-y-2.5 pb-4 border-b border-border">
        <p className="custom-lesson-eyebrow">{data.category} · Lesson {number}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{data.title}</h1>
        <p className="custom-lesson-intro">{data.intro}</p>
      </header>

      <section className="space-y-2">
        <h2>Learning outcomes</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Here are the ideas and skills you should understand from this lesson:</p>
        <ul className="custom-lesson-outcomes grid grid-cols-1 gap-2">
          {data.outcomes.map((item,i)=>(
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i+1}</span>
              <span className="min-w-0 flex-1 text-left text-sm leading-6 [text-align:left] [word-spacing:normal] [letter-spacing:normal] [hyphens:none]">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="custom-lesson-reading">
        <h2>Detailed lesson reading</h2>
        {[...data.sections, ...(expandedSections[number] || [])].map((section,i)=>(
          <Section key={i} title={section[0]}>{section[1]}</Section>
        ))}
      </section>

      <section className="custom-lesson-note">
        <h2>Case study: apply the principles</h2>
        <p>{data.case}</p>
        <p><strong>Study task:</strong> {data.activity}</p>
      </section>

      <section>
        <h2>Key terms</h2>
        <p>Use these terms accurately when explaining the topic and analysing practical situations.</p>
        <ul>{data.terms.split(' • ').map((term,i)=><li key={i}>{term}</li>)}</ul>
      </section>
      <section className="custom-lesson-sources">
        <h2>Further reading and authoritative references</h2>
        <p>Use these sources to deepen your understanding. Where a topic concerns Ghanaian law, consult the current official legislation and regulator guidance rather than relying on a general textbook.</p>
        <ul>{furtherReading.filter((source)=> {
          if (number === 11) return /Ghana Data Protection|Act 843|Tavani|ACM/.test(source.label);
          if (number === 3 || number === 4) return /NIST|Tavani|ACM/.test(source.label);
          if (number === 6) return /Creative Commons|Tavani/.test(source.label);
          if (number === 8) return /UNESCO|Tavani/.test(source.label);
          return /Tavani|ACM/.test(source.label);
        }).map((source)=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul>
      </section>

      <footer className="custom-lesson-takeaways">
        <h2>Key takeaways</h2>
        <ul>
          <li>Understand the central concepts and explain them in your own words.</li>
          <li>Apply the principles to realistic computing situations, not only definitions.</li>
          <li>Consider the people affected, the evidence available and the responsibilities involved.</li>
          <li>Consult current primary sources whenever a legal or technical requirement may have changed.</li>
        </ul>
      </footer>
    </article>
  );
}

export { lessons as professionalComputingLessons };

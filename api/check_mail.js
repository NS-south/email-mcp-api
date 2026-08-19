3
4
let lock = await client.getMailboxLock('INBOX');
let messages = [];
try {
// 1. 检索收件箱里的未读邮件 (unseen)
let searchResult = await client.search({ unseen: true });
if (searchResult && searchResult.length > 0) {
// 取最新发来的最多 3 封未读邮件
let targetSeq = searchResult.slice(-3);
let range = targetSeq.join(',');
for await (let message of client.fetch(range, { envelope: true, source: true })) {
let parsed = await simpleParser(message.source);
messages.push({
subject: message.envelope.subject || '无主题',
from: message.envelope.from?.[0]?.address || '未知发件人',
date: message.envelope.date,
content: (parsed.text || '（无文字正文）').trim().slice(0, 500)
});
}
messages.reverse();
// 2. 读取后自动将这些邮件标记为已读 (\Seen)
await client.messageFlagsAdd(range, ['\\Seen']);
}
} finally {
lock.release();
}
await client.logout();
// 3. 如果没有未读邮件，明确告知 AI
if (messages.length === 0) {
return res.status(200).json({
success: true,
count: 0,
emails: [],
notice: "当前没有收到新的未读邮件（之前的邮件已阅读过，对方尚未回复）。"
});
}
return res.status(200).json({ success: true, count: messages.length, emails: messages });
} catch (err) {
return res.status(500).json({ error: err.message });
}
};

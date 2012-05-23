/**
 * config
 */

exports.config = {
	name: 'Expro Future',
	description: 'Expro Future:泛盈商惠平台',
	version: '0.0.1',

	// site settings
	site_headers: [
		'<meta name="author" content="gbo@expro" />',
	],
	host: 'http://127.0.0.1', // host 结尾不要添加'/'
	site_logo: '/images/logo.png', // default is `name`
	site_navs: [
		// [ path, title, [target=''] ]
		[ '/about', '关于' ],
	],
	site_static_host: '', // 静态文件存储域名

        mysql: {
              host: 'exprofuture.mysql.aliyun.com'
            , port:3306
            , user: 'exprofuture'
            , password: '123456'
            , database:'exprofuture'
            , timezone:'Asia/Shanghai'
        },
        message_queue: {
            port: 1900,
            host: '127.0.0.1'
        },
	session_secret: 'expro_future',
        session_cookie: { maxAge: 60 * 60 * 1000 },
	auth_cookie_name: 'expro_future',
	port: 10080,

	// 话题列表显示的话题数量
	list_topic_count: 20,

	// mail SMTP
	mail_port: 25,
	mail_user: 'club',
	mail_pass: 'club',
	mail_host: 'smtp.126.com',
	mail_sender: 'club@126.com',
	mail_use_authentication: true,
	
	//weibo app key
	weibo_key: 10000000,

	// admin 可删除话题，编辑标签，设某人为达人
	admins: { admin: true },

	// [ [ plugin_name, options ], ... ]
	plugins: []
};

var host = exports.config.host;
if (host[host.length - 1] === '/') {
	exports.config.host = host.substring(0, host.length - 1);
}

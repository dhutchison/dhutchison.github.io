require 'yaml'
require 'rubygems'
require 'stringex'

desc 'Build and send to dev server'
task :build, :opt do |t, args|
    
    
    opt = args[:opt]
    if !opt then
      opt = "all"
    end

    puts sprintf("Building %s\n", opt)
    if ("all".casecmp opt) == 0 then
        css
        jekyll
    elsif("css".casecmp opt) == 0 then
      css
      # need to copy to the built site prior to deployment
      FileUtils.cp_r(Dir['assets/css/*'],'../dwi_built_site/assets/css')
    elsif("jekyll".casecmp opt) == 0 then
      jekyll
    end
    
    upload
    puts 'Done.'
end

def jekyll
  puts 'Building Jekyll pages...'
  sh 'bundle exec jekyll build -d ../dwi_built_site'
  puts 'Jekyll page build complete.'
end

def css
  puts 'Building CSS...'
  sh '/usr/local/bin/grunt build'
  puts 'CSS build complete.'
end

task :deploy_dev do
    upload
end

def upload
    puts 'Sending to server...'
    sh 'rsync -avz --delete ../dwi_built_site/ david@dev-lamp.local:/home/wwwroot/dwi/'
    puts 'Sent'

end

desc "Publish a draft"
task :publish, :filename do |t, args|
  # if there's a filename passed (rake publish[filename])
  # use it. Otherwise, list all available drafts in a menu
  
  source_dir = '/Users/david/Sites/dhutchison.github.io'
  posts_dir = '_posts'
  new_post_ext = 'markdown'
  
  unless args.filename
    file = choose_file(File.join(source_dir,'_drafts'))
    Process.exit unless file # no file selected
  else
    file = args.filename if File.exists?(File.expand_path(args.filename))
    raise "Specified file not found" unless file
  end
  now = Time.now
  short_date = now.strftime("%Y-%m-%d")
  long_date = now.strftime("%Y-%m-%d %H:%M")

  # separate the YAML headers
  contents = File.read(file).split(/^---\s*$/)
  if contents.count < 3 # Expects the draft to be properly formatted
    puts "Invalid header format on post #{File.basename(file)}"
    Process.exit
  end
  # parse the YAML. So much better than regex search and replaces
  headers = YAML::load("---\n"+contents[1])
  content = contents[2].strip

  should = { :generate => false, :deploy => false, :schedule => false, :limit => 0 }

  ### draft publishing ###
  # fall back to current date and title-based slug
  headers['date'] ||= long_date
  headers['slug'] ||= headers['title'].to_url.downcase

  # write out the modified YAML and post contents back to the original file
  File.open(file,'w+') {|file| file.puts YAML::dump(headers) + "---\n" + content + "\n"}
  # move the file to the posts folder with a standardized filename
  target = "#{source_dir}/#{posts_dir}/#{short_date}-#{headers['slug']}.#{new_post_ext}"
  mv file, target
  puts %Q{Published "#{headers['title']}" to #{target}}
  # deploy the site, full build
  Rake::Task[:build].invoke('all')
end

# Creates a user selection menu from directory listing
def choose_file(dir)
  puts "Choose file: #{dir}"
  @files = Dir["#{dir}/*"]
  @files.each_with_index { |f,i| puts "#{i+1}: #{f}" }
  print "> "
  num = STDIN.gets
  return false if num =~ /^[a-z ]*$/i
  file = @files[num.to_i - 1]
end

def ask(message, valid_options)
  return true if $skipask
  if valid_options
    answer = get_stdin("#{message} #{valid_options.delete_if{|opt| opt == ''}.to_s.gsub(/"/, '').gsub(/, /,'/')} ") while !valid_options.map{|opt| opt.nil? ? '' : opt.upcase }.include?(answer.nil? ? answer : answer.upcase)
  else
    answer = get_stdin(message)
  end
  answer
end
